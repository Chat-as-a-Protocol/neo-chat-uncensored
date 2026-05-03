import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import jwt from "jsonwebtoken";
import crypto, { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { createLogger, format, transports } from "winston";
import { z } from "zod";

import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Considera que o arquivo está em backend/src/server.js, então a raiz está 2 níveis acima
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

dotenv.config({ path: path.resolve(PROJECT_ROOT, "backend", ".env") });

// ===== STARTUP VALIDATION =====
if (process.env.NODE_ENV === "production") {
  const required = [
    "JWT_SECRET",
    "VENICE_API_KEY",
    "VENICE_MODEL",
    "FRONTEND_URL",
    "FLOWPAY_API_KEY",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(
      `FATAL: Missing required environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
}

const { JWT_SECRET, VENICE_MODEL } = process.env;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    // startup validation above already handles this, but guard defensively
    console.error("FATAL: JWT_SECRET is required in production.");
    process.exit(1);
  }
  console.warn(
    "WARNING: JWT_SECRET is not set. Using a random ephemeral secret — tokens will be invalidated on restart. DO NOT use in production.",
  );
}
// Use a random ephemeral secret in development if JWT_SECRET is not configured.
// In production this is guaranteed non-null by startup validation above.
const effectiveJwtSecret = JWT_SECRET || randomUUID();

const app = express();

import redis from "./lib/redis.js";
import { emailService } from "./services/email.js";
import {
  checkFlowPayHealth,
  createFlowPayCharge,
  formatFlowPayError,
} from "./services/flowpay.js";
import { ledgerService, LEDGER_TYPES } from "./services/ledger.js";
import { paymentService } from "./services/payments.js";
import { countTokensFromText } from "./utils/billing.js";
import { query } from "./utils/db.js";
import { parsePositiveInt } from "./utils/numbers.js";

// Carregar Configuração de Planos (NEØ PROTOCOL)
const plansPath = path.resolve(PROJECT_ROOT, "shared", "plans.json");
const runtimePromptPath = path.resolve(PROJECT_ROOT, "shared", "runtime-prompt.md");
let plans = { tiers: {}, packages: {} };
try {
  const plansData = await fs.readFile(plansPath, "utf-8");
  plans = JSON.parse(plansData);
} catch (err) {
  console.error("ERRO: Falha ao carregar shared/plans.json");
}

const FALLBACK_GUEST_PLAN = {
  limit: 500,
  messageLimit: 3,
  maxOutputTokens: 384,
};

const VENICE_API_BASE = (process.env.VENICE_API_BASE || "https://api.venice.ai/api/v1").replace(/\/+$/, "");
const VENICE_MODEL_NAME = VENICE_MODEL?.trim();

const normalizeAccessTier = (rawTier) => {
  if (rawTier === "premium" || rawTier === "paid_pro") return "pro";
  return rawTier || "guest";
};

const resolvePlanKey = (accessTier, isGuest) => {
  if (isGuest || accessTier === "guest") return "guest";
  if (accessTier === "pro") return plans.tiers.paid_pro ? "paid_pro" : "pro";
  if (accessTier === "paid_basic") return "paid_basic";
  return plans.tiers[accessTier] ? accessTier : "guest";
};

const getUserPlan = ({ redisTier, jwtTier, isGuest }) => {
  const accessTier = normalizeAccessTier(isGuest ? "guest" : redisTier || jwtTier);
  const planKey = resolvePlanKey(accessTier, isGuest);
  return {
    accessTier,
    planKey,
    tierConfig: plans.tiers[planKey] || plans.tiers.guest || FALLBACK_GUEST_PLAN,
  };
};

const persistUserPlan = async (userId, tier) => {
  const accessTier = normalizeAccessTier(tier);
  const planKey = resolvePlanKey(accessTier, accessTier === "guest");
  const tierConfig = plans.tiers[planKey] || plans.tiers.guest || FALLBACK_GUEST_PLAN;
  const limit = parsePositiveInt(tierConfig.limit, FALLBACK_GUEST_PLAN.limit);

  await redis.set(`tier:${userId}`, planKey);
  await redis.set(`limit:${userId}`, String(limit));

  return { accessTier, planKey, limit };
};

// Logger
const loggerTransports = [new transports.Console()];
if (process.env.NODE_ENV !== "production") {
  loggerTransports.push(new transports.File({ filename: "app.log" }));
}

const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: loggerTransports,
});

// Middleware de Log de Acesso
app.use((req, res, next) => {
  res.on("finish", () => {
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode}`);
  });
  next();
});

// 1. CORS deve vir primeiro para lidar com Preflight (OPTIONS)
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map(o => o.trim().replace(/\/$/, ""))
  : ["http://localhost:4321", "http://localhost:3000", "https://noxai.chat"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requisições sem origin (como mobile apps ou curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-nexus-signature"],
  }),
);

app.use(helmet());
// ===== UTILS =====
const getUserId = (email) => {
  const emailLower = email.toLowerCase().trim();
  return "user_" + crypto.createHash("sha256").update(emailLower).digest("hex").slice(0, 32);
};

const isDeliverableEmail = (email) => {
  return Boolean(email) && !String(email).endsWith("@guest.nox.local");
};

const getPaymentUserMetadata = (user) => {
  if (!isDeliverableEmail(user?.email)) return {};
  return {
    userEmail: user.email,
    userName: user.name || user.email.split("@")[0],
  };
};

// Trust the first proxy hop (Railway, etc.) so req.ip is the real client IP,
// which is required for express-rate-limit to work correctly behind a reverse proxy.
app.set("trust proxy", 1);

const resolveWebhookRecipient = async ({ userId, data = {}, metadata = {} }) => {
  const email =
    metadata.userEmail ||
    metadata.email ||
    data.userEmail ||
    data.customerEmail ||
    data.email;

  if (isDeliverableEmail(email)) {
    return {
      email,
      name: metadata.userName || metadata.name || data.userName || data.name,
    };
  }

  if (!process.env.DATABASE_URL) return null;

  try {
    const result = await query("SELECT email, name FROM users WHERE id = $1", [userId]);
    const user = result.rows[0];
    if (!isDeliverableEmail(user?.email)) return null;
    return { email: user.email, name: user.name };
  } catch (err) {
    logger.warn(`[Email] Unable to resolve recipient for user ${userId}: ${err.message}`);
    return null;
  }
};

const sendPaymentEmail = async ({
  userId,
  data,
  metadata,
  reference,
  entitlement,
  isTokenPurchase,
  tierName,
}) => {
  try {
    const recipient = await resolveWebhookRecipient({ userId, data, metadata });
    if (!recipient) {
      logger.info(`[Email] Skipped payment email for user ${userId}: recipient unavailable`);
      return;
    }

    const result = isTokenPurchase
      ? await emailService.sendPurchaseConfirmation(recipient.email, {
          userName: recipient.name,
          amount: entitlement.tokens,
          reference,
        })
      : await emailService.sendTierUpgrade(recipient.email, {
          userName: recipient.name,
          tierName,
        });

    if (result?.skipped) {
      logger.warn(`[Email] Skipped payment email for user ${userId}: ${result.reason}`);
      return;
    }

    logger.info(`[Email] Payment email sent for user ${userId}`);
  } catch (err) {
    logger.error(`[Email] Payment email failed for user ${userId}: ${err.message}`);
  }
};

// ===== WEBHOOKS (NΞØ Protocol) - MUST BE BEFORE express.json() =====

/**
 * Endpoint de Webhook para o FlowPay (via Nexus)
 * Recebe notificações de pagamento e atualiza o tier do usuário.
 */
app.post(
  "/webhooks/flowpay",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["x-nexus-signature"];
    const secret = process.env.FLOWPAY_WEBHOOK_SECRET;

    logger.info("[Webhook] Received FlowPay event from Nexus");

    // Validar Assinatura HMAC-SHA256
    if (process.env.NODE_ENV === "production" || secret) {
      if (!signature) {
        logger.warn("[Webhook] Missing signature");
        return res.status(401).send("Unauthorized: Missing Signature");
      }

      if (!secret) {
        logger.error("[Webhook] FLOWPAY_WEBHOOK_SECRET not configured");
        return res.status(500).send("Configuration Error");
      }

      const hmac = crypto.createHmac("sha256", secret);
      const digest = hmac.update(req.body).digest("hex");
      const signatureValue = Array.isArray(signature) ? signature[0] : signature;
      const normalizedSignature = String(signatureValue).replace(/^sha256=/, "");

      try {
        if (
          !crypto.timingSafeEqual(
            Buffer.from(digest, "hex"),
            Buffer.from(normalizedSignature, "hex"),
          )
        ) {
          logger.warn("[Webhook] Invalid signature");
          return res.status(401).send("Unauthorized: Invalid Signature");
        }
      } catch (err) {
        logger.error("[Webhook] Signature comparison error");
        return res.status(401).send("Unauthorized");
      }
    }

    try {
      const envelope = JSON.parse(req.body.toString());
      const { event } = envelope;
      const data = envelope.data || envelope.payload;

      if (event === "FLOWPAY:PAYMENT_RECEIVED") {
        const metadata = data?.metadata || {};
        const userId = data?.userId || metadata.userId || data?.payerId;
        const paymentId = data?.paymentId || data?.orderId || data?.chargeId || data?.id;

        if (!userId) {
          throw new Error("Missing userId in payload");
        }

        const reference = paymentId || `flowpay_${Date.now()}`;
        const amountBrl = Number(data?.amount ?? data?.value ?? metadata.amountBrl ?? metadata.price ?? 0);
        const currency = String(data?.currency || metadata.currency || "BRL").toUpperCase();

        const paymentRecord = await paymentService.recordFlowPayPayment({
          providerReference: reference,
          userId,
          amountBrl,
          currency,
          status: String(data?.status || "received").toLowerCase(),
          metadata: {
            ...metadata,
            event,
            paymentId: paymentId || null,
          },
        });

        if (!paymentRecord.persisted) {
          logger.warn(`[Webhook] Payment ${reference} not persisted: ${paymentRecord.reason}`);
        }

        let entry;
        let tierName = "P.R.O";
        const entitlement = paymentService.resolveEntitlement(metadata, plans);
        const isTokenPurchase = entitlement.kind === "token_purchase";

        if (isTokenPurchase) {
          if (entitlement.tokens <= 0) {
            throw new Error("Invalid token purchase metadata");
          }

          entry = await ledgerService.addEntry(
            userId,
            entitlement.tokens,
            LEDGER_TYPES.TOKEN_PURCHASE,
            reference,
          );

          if (entitlement.tierUpgrade) {
            await persistUserPlan(userId, entitlement.tierUpgrade);
          }

          logger.info(
            `[Webhook] User ${userId} purchased ${entitlement.tokens} tokens`,
          );
        } else {
          const plan = await persistUserPlan(userId, entitlement.tierUpgrade);
          tierName = plans.tiers?.[plan.planKey]?.name || plan.planKey || tierName;
          entry = await ledgerService.addEntry(
            userId,
            0, // Valor 0 conforme regra: Pro é controlado via Tier/Limit, não créditos no ledger
            LEDGER_TYPES.PRO_SUBSCRIPTION,
            reference,
          );
          logger.info(
            `[Webhook] User ${userId} upgraded to ${plan.planKey} (Subscription Event)`,
          );
        }

        if (!entry) {
          logger.info(
            `[Webhook] Event ${reference} already processed for user ${userId} in ledger`,
          );
          return res.status(200).json({ status: "success", message: "Already processed" });
        }

        await redis.set(`webhook_processed:${reference}`, "1", "EX", 86400);

        await sendPaymentEmail({
          userId,
          data,
          metadata,
          reference,
          entitlement,
          isTokenPurchase,
          tierName,
        });

        const successMessage = isTokenPurchase ? "Tokens added successfully" : "Tier updated successfully";
        
        logger.info(`[Webhook] Payment ${reference} processed for user ${userId} (${isTokenPurchase ? 'Tokens' : 'Pro Plan'})`);
        
        return res
          .status(200)
          .json({ status: "success", message: successMessage });
      }

      res.status(200).json({ status: "ignored", message: "Event not handled" });
    } catch (err) {
      logger.error(`[Webhook] Error processing event: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  },
);

app.use(express.json());

// ===== AUTH ROUTES =====
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

const signupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

const DUMMY_PASSWORD_HASH = "$2a$12$JcratiN0Fcf3MuRPumDS5eo7Qe/JnM1yuRont/31p6BIWmP9z3QOa";

app.post("/api/auth/guest", async (req, res) => {
  try {
    const rawDeviceId = String(req.body?.deviceId || randomUUID()).slice(0, 128);
    const userId = "guest_" + crypto.createHash("sha256").update(rawDeviceId).digest("hex").slice(0, 32);
    const email = `${userId}@guest.nox.local`;
    const tier = "guest";

    const token = jwt.sign(
      { id: userId, email, tier, guest: true },
      effectiveJwtSecret,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      token,
      user: { id: userId, email, tier, guest: true },
    });
  } catch (error) {
    logger.error("Guest auth error: " + error.message);
    res.status(500).json({ error: "Guest session unavailable" });
  }
});

app.post("/api/auth/signup", authLimiter, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid signup data. Password must be at least 8 characters." });
  }

  const { email, name, password } = parsed.data;
  try {
    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const userId = getUserId(email);

    await query(
      "INSERT INTO users (id, email, name, password_hash, tier) VALUES ($1, $2, $3, $4, 'free')",
      [userId, email, name || null, password_hash],
    );

    const token = jwt.sign({ id: userId, email, tier: "free" }, effectiveJwtSecret, { expiresIn: "7d" });

    res.status(201).json({ token, user: { id: userId, email, name: name || null, tier: "free" } });
  } catch (error) {
    logger.error("Signup error: " + error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email or password." });
  }

  const { email, password } = parsed.data;
  try {
    const result = await query(
      "SELECT id, email, name, tier, password_hash FROM users WHERE email = $1",
      [email],
    );
    const user = result.rows[0];

    const isValid = await bcrypt.compare(password, user?.password_hash || DUMMY_PASSWORD_HASH);

    if (!user || !isValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign({ id: user.id, email: user.email, tier: user.tier }, effectiveJwtSecret, { expiresIn: "7d" });

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, tier: user.tier } });
  } catch (error) {
    logger.error("Login error: " + error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  const secret = effectiveJwtSecret;

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// ===== RATE LIMITING POR USUÁRIO =====
const createUserRateLimit = () =>
  rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: async (req) => {
      const rawTier = (await redis.get(`tier:${req.user.id}`)) || req.user.tier || "free";
      const userTier = normalizeAccessTier(rawTier);
      const isPaid = userTier === "pro" || userTier === "paid_basic";
      return isPaid ? 60 : 10; // 60 req/min para pagos, 10 para free
    },
    keyGenerator: (req) => req.user.id,
    handler: (_req, res) => {
      res.status(429).json({
        error: "Rate limit exceeded",
        upgradeUrl: "/upgrade",
      });
    },
    store: {
      increment: async (key) => {
        const multi = redis.multi();
        multi.incr(key);
        multi.pexpire(key, 60000);
        const results = await multi.exec();
        const totalHits = results[0][1];
        return { totalHits, resetTime: new Date(Date.now() + 60000) };
      },
      decrement: (key) => redis.decr(key),
      resetKey: (key) => redis.del(key),
    },
  });

// ===== CHECK QUOTA MIDDLEWARE =====
const checkQuota = async (req, res, next) => {
  const today = new Date().toISOString().split("T")[0];
  
  try {
    // Busca paralela para reduzir latência (Hot Path)
    const [usage, redisTier, redisLimit] = await Promise.all([
      ledgerService.getDailyUsage(req.user.id, today),
      redis.get(`tier:${req.user.id}`).catch(() => null),
      redis.get(`limit:${req.user.id}`).catch(() => null)
    ]);

    const { accessTier, planKey, tierConfig } = getUserPlan({
      redisTier,
      jwtTier: req.user.tier,
      isGuest: Boolean(req.user.guest),
    });
    const defaultLimit = parsePositiveInt(tierConfig.limit, FALLBACK_GUEST_PLAN.limit);
    const { messageLimit } = tierConfig;
    
    const limit = parsePositiveInt(redisLimit, defaultLimit);

    // Validação de Contagem de Mensagens (Hardened Security)
    if (messageLimit !== null && messageLimit !== undefined) {
      const msgCountKey = `msg_count:${today}:${req.user.id}`;
      const newCount = await redis.incr(msgCountKey);
      if (newCount === 1) await redis.expire(msgCountKey, 86400);

      if (newCount > messageLimit) {
        await redis.decr(msgCountKey);
        logger.warn(`[Quota] Message limit reached for user ${req.user.id}: ${messageLimit}/${messageLimit}`);
        return res.status(403).json({
          error: "Message limit reached",
          message: "Seus 3 desejos foram ouvidos. Conclua o cadastro para continuar.",
          upgradeUrl: "/signup"
        });
      }
    }

    if (usage >= limit) {
      logger.warn(`[Quota] Limit exceeded for user ${req.user.id}: ${usage}/${limit}`);
      return res.status(403).json({
        error: "Daily quota exceeded",
        usage,
        limit,
        upgradeUrl: "/upgrade",
      });
    }

    req.currentUsage = usage;
    req.dailyLimit = limit;
    req.userTier = accessTier;
    req.planTier = planKey;
    req.maxOutputTokens = parsePositiveInt(
      tierConfig.maxOutputTokens,
      FALLBACK_GUEST_PLAN.maxOutputTokens,
    );
    next();
  } catch (err) {
    logger.error(`[Quota] Critical error in quota enforcement for user ${req.user?.id ?? "unknown"}:`, err);
    // Fail-Closed: protege contra uso ilimitado durante falhas do Redis/Ledger
    return res.status(503).json({
      error: "Service temporarily unavailable (Quota System)",
      message: "Por favor, tente novamente em instantes."
    });
  }
};

// ===== PERSONA MANAGER =====
async function loadPersona(personaId, userTier = "free") {
  // 1. Camada de Cache (Redis)
  const cacheKey = `manifest_cache:${personaId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    const manifest = JSON.parse(cached);
    // Validar tier mesmo no cache (Normalizado)
    const effectiveTier = userTier === "premium" ? "pro" : userTier;
    if (manifest.tier === "pro" && effectiveTier !== "pro") {
      throw new Error("PRO_REQUIRED");
    }
    return manifest.prompt;
  }

  // 2. Fallback para Persona Padrão (NØX)
  if (!personaId || personaId === "nox") {
    try {
      const filePath = path.resolve(PROJECT_ROOT, "src", "content", "manifests", "nox.md");
      const content = await fs.readFile(filePath, "utf-8");
      const fmMatch = content.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
      if (fmMatch) return fmMatch[2].trim();
      return content;
    } catch (err) {
      logger.warn(`[Persona] nox.md não encontrado em manifests, usando fallback.`);
      return "Protocolo NØX. Sem filtros. Atuação soberana.";
    }
  }

  // 3. Carregamento de Manifestos Locais
  try {
    const filePath = path.resolve(PROJECT_ROOT, "src", "content", "manifests", `${personaId}.md`);
    const content = await fs.readFile(filePath, "utf-8");

    // Parser Nativo de Frontmatter (Regex)
    const fmMatch = content.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
    if (!fmMatch) throw new Error("INVALID_MANIFEST_FORMAT");

    const fmRaw = fmMatch[1];
    const prompt = fmMatch[2].trim();

    // Extrair tier do YAML simplificado
    const tierMatch = fmRaw.match(/tier:\s*["']?(\w+)["']?/);
    const tier = tierMatch ? tierMatch[1] : "free";

    // Validação de Tier (Normalizado)
    const effectiveTier = userTier === "premium" ? "pro" : userTier;
    if (tier === "pro" && effectiveTier !== "pro") {
      throw new Error("PRO_REQUIRED");
    }

    // Salvar no Cache por 1 hora
    await redis.set(cacheKey, JSON.stringify({ tier, prompt }), "EX", 3600);
    
    return prompt;
  } catch (err) {
    if (err.message === "PRO_REQUIRED") throw err;
    logger.warn(`Could not load persona ${personaId}: ${err.message}`);
    // Fallback silencioso para o padrão
    return await fs.readFile(runtimePromptPath, "utf-8").catch(() => "NØX ativo.");
  }
}

// ===== VENICE API PROXY =====
app.post(
  "/api/chat",
  authenticateToken,
  createUserRateLimit(),
  checkQuota,
  async (req, res) => {
    try {
      const {
        messages,
        temperature = 0.7,
        stream = true,
        personaId = "nox",
      } = req.body;

      // Validar input
      const schema = z.object({
        messages: z
          .array(
            z.object({
              role: z.enum(["user", "assistant", "system"]),
              content: z.string().min(1).max(32000),
            }),
          )
          .max(50),
        stream: z.boolean().optional(),
        personaId: z.string().optional(),
      });

      schema.parse(req.body);

      if (!VENICE_MODEL_NAME) {
        return res.status(503).json({ error: "AI model is not configured" });
      }

      // Carregar Persona Dinâmica com Validação de Tier
      const userTier = req.userTier || "guest";
      // 1. Carregar Persona
      let basePrompt;
      try {
        basePrompt = await loadPersona(personaId, userTier);
      } catch (err) {
        if (err.message === "PRO_REQUIRED") {
          return res.status(403).json({ 
            error: "Módulo Pro Requerido", 
            upgradeUrl: "/upgrade" 
          });
        }
        throw err;
      }

      // 2. Carregar Runtime Contract (NØX Core)
      let finalSystemPrompt = basePrompt;
      if (personaId && personaId !== "nox") {
        try {
          const runtimePrompt = await fs.readFile(runtimePromptPath, "utf-8");
          // O contrato vem POR ÚLTIMO para ter precedência (Recency Bias da LLM)
          finalSystemPrompt = `${basePrompt}\n\n---\n\n# NØX RUNTIME CONTRACT (STRICT ENFORCEMENT)\n${runtimePrompt}`;
        } catch (err) {
          logger.warn("[Chat] Falha ao carregar runtime-prompt para merge; usando apenas basePrompt.");
        }
      }

      // 3. Montar Mensagens (Filtra qualquer tentativa de injeção de 'system' por parte do usuário)
      const userMessages = messages.filter(m => m.role !== "system");
      
      const finalMessages = [
        { role: "system", content: finalSystemPrompt },
        ...userMessages,
      ];

      // Chamar Venice API
      const controller = new AbortController();
      const veniceTimeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
      let veniceResponse;
      try {
        veniceResponse = await fetch(
          `${VENICE_API_BASE}/chat/completions`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.VENICE_API_KEY}`,
              "Content-Type": "application/json",
              Accept: stream ? "text/event-stream" : "application/json",
            },
            body: JSON.stringify({
              model: VENICE_MODEL_NAME,
              messages: finalMessages,
              temperature,
              stream,
              max_tokens: req.maxOutputTokens || FALLBACK_GUEST_PLAN.maxOutputTokens,
              venice_parameters: {
                include_venice_system_prompt: false, // Desabilitado para garantir dominância do NØX Contract
                ...(req.body.enableWebSearch && { enable_web_search: "auto" }),
              },
            }),
            signal: controller.signal,
          },
        );
      } finally {
        clearTimeout(veniceTimeout);
      }

      if (!veniceResponse.ok) {
        const error = await veniceResponse.text();
        logger.error("Venice API error:", error);
        return res
          .status(502)
          .json({ error: "AI service temporarily unavailable" });
      }

      // Se for streaming
      if (stream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const reader = veniceResponse.body.getReader();
        const chunkDecoder = new TextDecoder();
        let assistantContent = "";
        const processStreamChunk = (chunk) => {
          if (!chunk) return;
          res.write(chunk);

          // Acumular conteúdo para billing preciso
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") continue;
              try {
                const data = JSON.parse(dataStr);
                assistantContent += data.choices?.[0]?.delta?.content || "";
              } catch (e) {
                // Ignore incomplete chunks
              }
            }
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          processStreamChunk(chunkDecoder.decode(value, { stream: true }));
        }
        processStreamChunk(chunkDecoder.decode());

        // Registrar consumo no ledger (Síncrono conforme solicitado)
        const tokens = countTokensFromText(assistantContent);
        if (tokens > 0) {
          try {
            await ledgerService.addEntry(
              req.user.id,
              -tokens,
              LEDGER_TYPES.TOKEN_CONSUMPTION,
              "chat_" + randomUUID(),
            );
          } catch (err) {
            logger.error("Ledger error:", err);
          }
        }

        res.end();
      } else {
        // Modo não-streaming
        const data = await veniceResponse.json();

        // Contar tokens aproximados
        const tokens = data.usage?.total_tokens || 0;

        ledgerService
          .addEntry(
            req.user.id,
            -tokens,
            LEDGER_TYPES.TOKEN_CONSUMPTION,
            "venice_sync_" + randomUUID(),
          )
          .catch((err) => logger.error("Ledger error:", err));

        res.json({
          ...data,
          quota: {
            used: req.currentUsage + tokens,
            limit: req.dailyLimit,
            remaining: req.dailyLimit - req.currentUsage - tokens,
          },
        });
      }
    } catch (error) {
      logger.error("Chat error:", error);
      if (error.name === "AbortError") {
        return res
          .status(504)
          .json({ error: "AI service timed out. Please try again." });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ===== MODELOS DISPONÍVEIS =====
app.get("/api/models", authenticateToken, async (req, res) => {
  try {
    if (!VENICE_MODEL_NAME) {
      return res.status(503).json({ error: "AI model is not configured" });
    }

    const userTier = (await redis.get(`tier:${req.user.id}`)) || req.user.tier || "free";

    const cachedModels = await redis.get('models_cache');
    let data;
    if (cachedModels) {
      data = JSON.parse(cachedModels);
    } else {
      // Puxa os modelos reais da API da Venice (somente text)
      const veniceResponse = await fetch(
        `${VENICE_API_BASE}/models?type=text`,
        {
          headers: {
            Authorization: `Bearer ${process.env.VENICE_API_KEY}`,
          },
        },
      );

      if (!veniceResponse.ok) {
        throw new Error("Failed to fetch models from Venice API");
      }

      const json = await veniceResponse.json();
      data = json.data;
      await redis.setex('models_cache', 3600, JSON.stringify(data));
    }

    const allModels = data.map((model) => model.id);

    // Lógica de Tier (exemplo: premium vê tudo, free vê um subconjunto ou todos)
    // Como os modelos são dinâmicos agora, podemos retornar todos e deixar a UI mostrar
    // Ou aplicar uma regra de blacklist/whitelist. Por padrão, deixarei todos disponíveis
    // para mostrar a integração real. Se quiser travar, filtramos aqui.

    res.json({
      available: allModels,
      currentTier: userTier,
      defaultModel: VENICE_MODEL_NAME,
    });
  } catch (error) {
    logger.error("Models fetch error:", error);
    res.status(500).json({ error: "Failed to load models" });
  }
});

// ===== MAGIC LINK AUTH =====
const MAGIC_LINK_EXPIRATION_MINUTES =
  parseInt(process.env.MAGIC_LINK_EXPIRATION_MINUTES, 10) || 10;

const magicLinkRequestSchema = z.object({
  email: z.string().email().max(254),
});

const magicLinkVerifySchema = z.object({
  token: z.string().min(1).max(128),
});

// Rate limiter: max 5 magic link requests per 15 minutes per IP
const magicLinkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many magic link requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/auth/magic-link/request
 * Accepts { email } and sends a magic link to the user's inbox.
 * Creates the user account if it doesn't exist yet.
 */
app.post("/api/auth/magic-link/request", magicLinkLimiter, async (req, res) => {
  const parsed = magicLinkRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "A valid email address is required." });
  }

  const { email } = parsed.data;

  try {
    // Ensure user exists — create one if not
    let userResult = await query("SELECT id, email, name, tier FROM users WHERE email = $1", [email]);
    let user = userResult.rows[0];

    if (!user) {
      const userId = getUserId(email);
      // Generate a random unusable password hash for magic-link-only accounts
      const randomPasswordHash = await import("node:crypto").then(
        (m) => "$2b$12$" + m.randomBytes(22).toString("base64").slice(0, 53),
      );
      await query(
        "INSERT INTO users (id, email, name, password_hash, tier) VALUES ($1, $2, $3, $4, 'free') ON CONFLICT (email) DO NOTHING",
        [userId, email, null, randomPasswordHash],
      );
      // Re-fetch in case of race condition
      userResult = await query("SELECT id, email, name, tier FROM users WHERE email = $1", [email]);
      user = userResult.rows[0];
    }

    if (!user) {
      // Should never happen, but guard defensively
      logger.error(`[MagicLink] Failed to find or create user for email: ${email}`);
      return res.status(500).json({ error: "Internal server error" });
    }

    // Generate a cryptographically secure token (32 random bytes → 64 hex chars)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRATION_MINUTES * 60 * 1000);

    // Persist token in database
    await query(
      `INSERT INTO magic_link_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt],
    );

    // Store token in Redis with TTL for fast lookup
    await redis.setex(
      `magic_link:${token}`,
      MAGIC_LINK_EXPIRATION_MINUTES * 60,
      user.id,
    );

    // Send email via Resend
    await emailService.sendMagicLink(email, { token });

    logger.info(`[MagicLink] Link sent to ${email} (user: ${user.id})`);

    return res.json({
      success: true,
      message: "Check your email for the magic link.",
    });
  } catch (err) {
    logger.error(`[MagicLink] Request error: ${err.message}`);
    return res.status(500).json({ error: "Failed to send magic link. Please try again." });
  }
});

/**
 * POST /api/auth/magic-link/verify
 * Accepts { token }, validates it, marks it used, and returns a JWT.
 */
app.post("/api/auth/magic-link/verify", async (req, res) => {
  const parsed = magicLinkVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "A valid token is required." });
  }

  const { token } = parsed.data;

  try {
    // Fast path: check Redis first
    const userId = await redis.get(`magic_link:${token}`);
    if (!userId) {
      return res.status(401).json({ error: "Invalid or expired magic link." });
    }

    // Verify token in database and ensure it hasn't been used
    const tokenResult = await query(
      `SELECT id, user_id, expires_at, used_at
       FROM magic_link_tokens
       WHERE token = $1`,
      [token],
    );

    const tokenRow = tokenResult.rows[0];
    if (!tokenRow) {
      await redis.del(`magic_link:${token}`);
      return res.status(401).json({ error: "Invalid or expired magic link." });
    }

    if (tokenRow.used_at) {
      await redis.del(`magic_link:${token}`);
      return res.status(401).json({ error: "This magic link has already been used." });
    }

    if (new Date(tokenRow.expires_at) < new Date()) {
      await redis.del(`magic_link:${token}`);
      return res.status(401).json({ error: "This magic link has expired." });
    }

    // Mark token as used in database
    await query(
      "UPDATE magic_link_tokens SET used_at = NOW() WHERE id = $1",
      [tokenRow.id],
    );

    // Delete token from Redis (single-use enforcement)
    await redis.del(`magic_link:${token}`);

    // Fetch user data
    const userResult = await query(
      "SELECT id, email, name, tier FROM users WHERE id = $1",
      [tokenRow.user_id],
    );
    const user = userResult.rows[0];

    if (!user) {
      logger.error(`[MagicLink] User not found for id: ${tokenRow.user_id}`);
      return res.status(500).json({ error: "Internal server error" });
    }

    // Issue JWT
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, tier: user.tier },
      effectiveJwtSecret,
      { expiresIn: "7d" },
    );

    logger.info(`[MagicLink] Verified for user ${user.id}`);

    return res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
      },
    });
  } catch (err) {
    logger.error(`[MagicLink] Verify error: ${err.message}`);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ===== USAGE STATS & LEDGER =====
const usageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user.id,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/api/usage", authenticateToken, usageLimiter, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [usage, redisTier, redisLimit] = await Promise.all([
      ledgerService.getDailyUsage(req.user.id, today),
      redis.get(`tier:${req.user.id}`).catch(() => null),
      redis.get(`limit:${req.user.id}`).catch(() => null),
    ]);
    const { accessTier, planKey, tierConfig } = getUserPlan({
      redisTier,
      jwtTier: req.user.tier,
      isGuest: Boolean(req.user.guest),
    });
    const defaultLimit = parsePositiveInt(tierConfig.limit, FALLBACK_GUEST_PLAN.limit);
    const limit = parsePositiveInt(redisLimit, defaultLimit);

    res.json({
      today: parseInt(usage),
      limit,
      tier: accessTier,
      plan: planKey,
      remaining: limit - parseInt(usage),
      maxOutputTokens: parsePositiveInt(
        tierConfig.maxOutputTokens,
        FALLBACK_GUEST_PLAN.maxOutputTokens,
      ),
    });
  } catch (err) {
    logger.error(`[Usage] Error fetching usage for user ${req.user?.id ?? "unknown"}: ${err.message}`);
    res.status(503).json({ error: "Service temporarily unavailable" });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/api/ledger", authenticateToken, async (req, res) => {
  try {
    const statement = await ledgerService.getStatement(req.user.id);
    const balance = await ledgerService.getBalance(req.user.id);
    res.json({ balance, statement });
  } catch (error) {
    logger.error("Ledger fetch error:", error);
    res.status(500).json({ error: "Failed to load ledger" });
  }
});

// ===== FLOWPAY INTEGRATION =====

app.post("/api/flowpay/create-charge", authenticateToken, async (req, res) => {
  if (process.env.ENABLE_PRO_ENGINE_CHECKOUT !== "true") {
    return res.status(404).json({ error: "Not found" });
  }

  try {
    const selected = plans.products?.pro_analyst;
    if (!selected) {
      return res.status(503).json({ error: "P.R.O product is not configured" });
    }

    // Use a single canonical frontend URL for callbacks, even if multiple are allowed for CORS
    const frontendBaseUrl = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",")[0]
      : "http://localhost:4321";

    const data = await createFlowPayCharge({
      amount: selected.price,
      currency: "BRL",
      orderId: `nox_${randomUUID()}`,
      userId: req.user.id,
      callbackUrl: `${frontendBaseUrl}/success`,
      metadata: {
        ...getPaymentUserMetadata(req.user),
        productId: selected.id,
        personaId: selected.persona_id,
        plan: selected.tier_upgrade,
        tierUpgrade: selected.tier_upgrade,
        userId: req.user.id,
        amountBrl: selected.price,
        type: "product_purchase",
      },
    });

    res.json({ checkoutUrl: data.checkoutUrl });
  } catch (error) {
    logger.error("FlowPay create-charge error", formatFlowPayError(error));
    res.status(error.statusCode || 500).json({ error: "Failed to initiate payment" });
  }
});

// Webhook logic moved up before express.json() to preserve raw body for signature verification.

// ===== TOKEN PURCHASE ENDPOINT =====
app.post("/api/tokens/purchase", authenticateToken, async (req, res) => {
  try {
    const rawTier = await redis.get(`tier:${req.user.id}`) || req.user.tier || "free";
    const userTier = normalizeAccessTier(rawTier);
    
    if (userTier === "pro") {
      return res.status(403).json({ 
        error: "Pro users cannot purchase additional token packages",
        upgradeUrl: null
      });
    }

    const { package: pkg } = req.body;
    const selected = plans.packages?.[pkg];
    if (!selected) return res.status(400).json({ error: "Invalid package" });
    
    // Normalização canônica da URL de callback (conforme padrão /api/flowpay/create-charge)
    const frontendBaseUrl = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",")[0]
      : "http://localhost:4321";

    const data = await createFlowPayCharge({
      amount: selected.price,
      currency: "BRL",
      orderId: `tokens_${randomUUID()}`,
      userId: req.user.id,
      callbackUrl: `${frontendBaseUrl}/success`,
      metadata: {
        ...getPaymentUserMetadata(req.user),
        packageId: selected.id || pkg,
        tokens: selected.tokens,
        price: selected.price,
        tierUpgrade: selected.tier_upgrade,
        userId: req.user.id,
        type: "tokens_purchase"
      }
    });
    
    res.json({ checkoutUrl: data.checkoutUrl });
  } catch (error) {
    logger.error("[Tokens] Purchase error", formatFlowPayError(error));
    res.status(error.statusCode || 500).json({ error: "Failed to create token purchase" });
  }
});

// ===== PRODUCT PURCHASE ENDPOINT =====
app.post("/api/products/purchase", authenticateToken, async (req, res) => {
  try {
    const rawTier = (await redis.get(`tier:${req.user.id}`)) || req.user.tier || "free";
    const userTier = normalizeAccessTier(rawTier);

    if (userTier === "pro") {
      return res.status(403).json({
        error: "P.R.O access is already active",
        upgradeUrl: null,
      });
    }

    const { productId } = req.body;
    const selected = plans.products?.[productId];
    if (!selected) return res.status(400).json({ error: "Invalid product" });

    const frontendBaseUrl = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",")[0]
      : "http://localhost:4321";

    const data = await createFlowPayCharge({
      amount: selected.price,
      currency: "BRL",
      orderId: `product_${randomUUID()}`,
      userId: req.user.id,
      callbackUrl: `${frontendBaseUrl}/success`,
      metadata: {
        ...getPaymentUserMetadata(req.user),
        productId: selected.id || productId,
        personaId: selected.persona_id,
        price: selected.price,
        tierUpgrade: selected.tier_upgrade,
        userId: req.user.id,
        type: "product_purchase",
      },
    });

    res.json({ checkoutUrl: data.checkoutUrl });
  } catch (error) {
    logger.error("[Products] Purchase error", formatFlowPayError(error));
    res.status(error.statusCode || 500).json({ error: "Failed to create product purchase" });
  }
});

// ===== FLOWPAY DIAGNOSTICS & TESTING =====

const ensureFlowPayDiagnosticsEnabled = (_req, res, next) => {
  if (process.env.ENABLE_FLOWPAY_DIAGNOSTICS !== "true") {
    return res.status(404).json({ error: "Not found" });
  }
  next();
};

// 1. Health Check da API FlowPay
app.get("/api/flowpay/health", authenticateToken, ensureFlowPayDiagnosticsEnabled, async (_req, res) => {
  try {
    const health = await checkFlowPayHealth();
    
    res.json({ 
      status: health.ok ? "online" : "offline",
      statusCode: health.status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error("FlowPay health error", formatFlowPayError(error));
    res.status(error.statusCode || 500).json({ status: "error", error: "FlowPay health check failed" });
  }
});

// 2. Simulação de Cobrança (Sandbox)
app.post("/api/flowpay/test-charge", authenticateToken, ensureFlowPayDiagnosticsEnabled, async (req, res) => {
  try {
    // Normalização canônica da URL de callback
    const frontendBaseUrl = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",")[0]
      : "http://localhost:4321";

    const data = await createFlowPayCharge({
      amount: 1, // R$ 1,00 para teste
      currency: "BRL",
      orderId: `test_${randomUUID()}`,
      userId: req.user.id,
      callbackUrl: `${frontendBaseUrl}/success`,
      testMode: true // Flag vital para não gerar cobrança real
    });

    res.json({ 
      success: true,
      chargeId: data.id,
      checkoutUrl: data.checkoutUrl,
      amount: 1
    });
  } catch (error) {
    logger.error("FlowPay Test Charge Error", formatFlowPayError(error));
    res.status(error.statusCode || 500).json({ success: false, error: "FlowPay test charge failed" });
  }
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  logger.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`NØX Backend running on port ${PORT}`);
});
