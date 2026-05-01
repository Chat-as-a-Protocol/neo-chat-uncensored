import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import jwt from "jsonwebtoken";
import crypto, { randomUUID } from "node:crypto";
import { createLogger, format, transports } from "winston";
import { z } from "zod";

import fs from "node:fs/promises";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// ===== STARTUP VALIDATION =====
if (process.env.NODE_ENV === "production") {
  const required = [
    "JWT_SECRET",
    "VENICE_API_KEY",
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

const JWT_SECRET = process.env.JWT_SECRET;
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
import { ledgerService, LEDGER_TYPES } from "./services/ledger.js";
import { paymentService } from "./services/payments.js";
import { countTokensFromText } from "./utils/billing.js";
import { query } from "./utils/db.js";

// Carregar Configuração de Planos (NEØ PROTOCOL)
const plansPath = path.resolve(process.cwd(), "..", "shared", "plans.json");
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

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

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
const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "app.log" }),
  ],
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
  : ["http://localhost:4321", "http://localhost:3000", "https://laughter.up.railway.app"];

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

const getLegacyUserId = (email) => {
  return "user_" + Buffer.from(email).toString("base64");
};

// Trust the first proxy hop (Railway, etc.) so req.ip is the real client IP,
// which is required for express-rate-limit to work correctly behind a reverse proxy.
app.set("trust proxy", 1);

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

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    // Verify if user exists
    const existing = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const userId = getUserId(email);

    await query(
      "INSERT INTO users (id, email, name, password_hash, tier) VALUES ($1, $2, $3, $4, 'free')",
      [userId, email, name, password_hash]
    );

    const token = jwt.sign({ id: userId, email, tier: "free" }, effectiveJwtSecret, { expiresIn: "7d" });
    
    res.status(201).json({ token, user: { id: userId, email, name, tier: "free" } });
  } catch (error) {
    logger.error("Signup error: " + error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

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
    const messageLimit = tierConfig.messageLimit;
    
    const limit = parsePositiveInt(redisLimit, defaultLimit);

    // Validação de Contagem de Mensagens (Hardened Security)
    if (messageLimit !== null && messageLimit !== undefined) {
      const msgCountKey = `msg_count:${today}:${req.user.id}`;
      const currentMsgs = parseInt(await redis.get(msgCountKey) || "0");
      
      if (currentMsgs >= messageLimit) {
        logger.warn(`[Quota] Message limit reached for user ${req.user.id}: ${currentMsgs}/${messageLimit}`);
        return res.status(403).json({
          error: "Message limit reached",
          message: "Seus 3 desejos foram ouvidos. Conclua o cadastro para continuar.",
          upgradeUrl: "/signup"
        });
      }
      // Incrementar contador (expira em 24h)
      await redis.incr(msgCountKey);
      await redis.expire(msgCountKey, 86400);
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

  // 2. Fallback para Persona Padrão
  if (!personaId || personaId === "nox") {
    try {
      const promptPath = path.resolve(process.cwd(), "..", "shared", "runtime-prompt.md");
      const prompt = await fs.readFile(promptPath, "utf-8");
      return prompt;
    } catch (err) {
      return "Protocolo NØX. Sem filtros.";
    }
  }

  // 3. Carregamento de Manifestos Locais
  try {
    const filePath = path.resolve(process.cwd(), "..", "src", "content", "manifests", `${personaId}.md`);
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
    const promptPath = path.resolve(process.cwd(), "..", "shared", "runtime-prompt.md");
    return await fs.readFile(promptPath, "utf-8").catch(() => "NØX ativo.");
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
        model = process.env.VENICE_MODEL || "venice-uncensored-1-2",
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
        model: z.string().optional(),
        stream: z.boolean().optional(),
        personaId: z.string().optional(),
      });

      schema.parse(req.body);

      // Carregar Persona Dinâmica com Validação de Tier
      const userTier = req.userTier || "guest";
      let systemPrompt;
      try {
        systemPrompt = await loadPersona(personaId, userTier);
      } catch (err) {
        if (err.message === "PRO_REQUIRED") {
          return res.status(403).json({ 
            error: "Módulo Pro Requerido", 
            upgradeUrl: "/upgrade" 
          });
        }
        throw err;
      }

      const finalMessages = [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        ...messages,
      ];

      // Chamar Venice API
      const controller = new AbortController();
      const veniceTimeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
      let veniceResponse;
      try {
        veniceResponse = await fetch(
          "https://api.venice.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.VENICE_API_KEY}`,
              "Content-Type": "application/json",
              Accept: stream ? "text/event-stream" : "application/json",
            },
            body: JSON.stringify({
              model,
              messages: finalMessages,
              temperature,
              stream,
              max_tokens: req.maxOutputTokens || FALLBACK_GUEST_PLAN.maxOutputTokens,
              venice_parameters: {
                include_venice_system_prompt: true, // Usa o prompt nativo da Venice
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
        let assistantContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
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
        }

        // Registrar consumo no ledger (Síncrono conforme solicitado)
        const tokens = countTokensFromText(assistantContent);
        if (tokens > 0) {
          try {
            await ledgerService.addEntry(
              req.user.id,
              -tokens,
              LEDGER_TYPES.TOKEN_CONSUMPTION,
              "chat_" + Date.now()
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
            "CONSUMPTION",
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
    const userTier = (await redis.get(`tier:${req.user.id}`)) || "free";

    const cachedModels = await redis.get('models_cache');
    let data;
    if (cachedModels) {
      data = JSON.parse(cachedModels);
    } else {
      // Puxa os modelos reais da API da Venice (somente text)
      const veniceResponse = await fetch(
        "https://api.venice.ai/api/v1/models?type=text",
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
      allModelDetails: data,
      currentTier: userTier,
      defaultModel: process.env.VENICE_MODEL || "venice-uncensored-1-2",
    });
  } catch (error) {
    logger.error("Models fetch error:", error);
    res.status(500).json({ error: "Failed to load models" });
  }
});

// ===== AUTH ROUTES =====
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
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
  name: z.string().min(1).max(100),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email or password." });
  }

  const { email, password } = parsed.data;
  
  // Try new SHA-256 scheme first
  let userId = getUserId(email);
  let passwordHash = await redis.get(`password:${userId}`);

  // Fallback to legacy base64 scheme
  if (!passwordHash) {
    const legacyId = getLegacyUserId(email);
    const legacyHash = await redis.get(`password:${legacyId}`);
    if (legacyHash) {
      userId = legacyId;
      passwordHash = legacyHash;
    }
  }

  // Timing-safe check: use a real, valid bcrypt hash for non-existent users
  const dummyHash = "$2b$12$K6/vXy0G.S7.fG7.k7.m7.O5O5O5O5O5O5O5O5O5O5O5O5O5O5O5";
  const actualHash = passwordHash || dummyHash;
  const valid = await bcrypt.compare(password, actualHash);

  if (!passwordHash || !valid) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const tier = (await redis.get(`tier:${userId}`)) || "free";

  const token = jwt.sign(
    { id: userId, email, tier },
    effectiveJwtSecret,
    { expiresIn: "7d" },
  );

  res.json({ token, user: { id: userId, email, tier } });
});

app.post("/api/auth/signup", authLimiter, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid signup data. Password must be at least 8 characters.",
    });
  }

  const { email, name, password } = parsed.data;
  const userId = getUserId(email);

  // Reject if account already exists (check both schemes to be safe)
  const existing = await redis.get(`password:${userId}`);
  const legacyExisting = await redis.get(`password:${getLegacyUserId(email)}`);
  
  if (existing || legacyExisting) {
    return res
      .status(409)
      .json({ error: "An account with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await redis.set(`password:${userId}`, passwordHash);

  const token = jwt.sign(
    { id: userId, email, name, tier: "free" },
    effectiveJwtSecret,
    { expiresIn: "7d" },
  );

  res
    .status(201)
    .json({ token, user: { id: userId, email, name, tier: "free" } });
});

// ===== USAGE STATS & LEDGER =====
app.get("/api/usage", authenticateToken, async (req, res) => {
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
    const flowpayUrl =
      process.env.FLOWPAY_API_URL || "https://api.flowpay.cash";
    const apiKey = process.env.FLOWPAY_API_KEY;
    const selected = plans.products?.pro_analyst;
    if (!selected) {
      return res.status(503).json({ error: "P.R.O product is not configured" });
    }

    // Use a single canonical frontend URL for callbacks, even if multiple are allowed for CORS
    const frontendBaseUrl = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",")[0]
      : "http://localhost:4321";

    const response = await fetch(`${flowpayUrl}/api/create-charge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        amount: selected.price,
        currency: "BRL",
        orderId: `nox_${randomUUID()}`,
        userId: req.user.id,
        callbackUrl: `${frontendBaseUrl}/success`,
        metadata: {
          productId: selected.id,
          personaId: selected.persona_id,
          plan: selected.tier_upgrade,
          tierUpgrade: selected.tier_upgrade,
          userId: req.user.id,
          amountBrl: selected.price,
          type: "product_purchase",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("FlowPay API error response:", data);
      throw new Error(data.message || "Failed to create FlowPay charge");
    }

    res.json({ checkoutUrl: data.checkoutUrl });
  } catch (error) {
    logger.error("FlowPay create-charge error:", error);
    res.status(500).json({ error: "Failed to initiate payment" });
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
    
    const flowpayUrl = process.env.FLOWPAY_API_URL || "https://api.flowpay.cash";
    
    // Normalização canônica da URL de callback (conforme padrão /api/flowpay/create-charge)
    const frontendBaseUrl = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",")[0]
      : "http://localhost:4321";

    const response = await fetch(`${flowpayUrl}/api/create-charge`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.FLOWPAY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: selected.price,
        currency: "BRL",
        orderId: `tokens_${randomUUID()}`,
        userId: req.user.id,
        callbackUrl: `${frontendBaseUrl}/success`,
        metadata: { 
          packageId: selected.id || pkg,
          tokens: selected.tokens,
          price: selected.price,
          tierUpgrade: selected.tier_upgrade,
          userId: req.user.id,
          type: "tokens_purchase"
        }
      })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "FlowPay Error");
    
    res.json({ checkoutUrl: data.checkoutUrl });
  } catch (error) {
    logger.error(`[Tokens] Purchase error: ${error.message}`);
    res.status(500).json({ error: "Failed to create token purchase" });
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

    const flowpayUrl = process.env.FLOWPAY_API_URL || "https://api.flowpay.cash";
    const frontendBaseUrl = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",")[0]
      : "http://localhost:4321";

    const response = await fetch(`${flowpayUrl}/api/create-charge`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLOWPAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: selected.price,
        currency: "BRL",
        orderId: `product_${randomUUID()}`,
        userId: req.user.id,
        callbackUrl: `${frontendBaseUrl}/success`,
        metadata: {
          productId: selected.id || productId,
          personaId: selected.persona_id,
          price: selected.price,
          tierUpgrade: selected.tier_upgrade,
          userId: req.user.id,
          type: "product_purchase",
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "FlowPay Error");

    res.json({ checkoutUrl: data.checkoutUrl });
  } catch (error) {
    logger.error(`[Products] Purchase error: ${error.message}`);
    res.status(500).json({ error: "Failed to create product purchase" });
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
    const flowpayUrl = process.env.FLOWPAY_API_URL || "https://api.flowpay.cash";
    const response = await fetch(`${flowpayUrl}/api/health`, {
      headers: { "Authorization": `Bearer ${process.env.FLOWPAY_API_KEY}` }
    });
    
    res.json({ 
      status: response.ok ? "online" : "offline",
      statusCode: response.status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: "error", error: error.message });
  }
});

// 2. Simulação de Cobrança (Sandbox)
app.post("/api/flowpay/test-charge", authenticateToken, ensureFlowPayDiagnosticsEnabled, async (req, res) => {
  try {
    const flowpayUrl = process.env.FLOWPAY_API_URL || "https://api.flowpay.cash";
    
    // Normalização canônica da URL de callback
    const frontendBaseUrl = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",")[0]
      : "http://localhost:4321";

    const response = await fetch(`${flowpayUrl}/api/create-charge`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.FLOWPAY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: 1, // R$ 1,00 para teste
        currency: "BRL",
        orderId: `test_${randomUUID()}`,
        userId: req.user.id,
        callbackUrl: `${frontendBaseUrl}/success`,
        testMode: true // Flag vital para não gerar cobrança real
      })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "FlowPay test failed");

    res.json({ 
      success: true,
      chargeId: data.id,
      checkoutUrl: data.checkoutUrl,
      amount: 1
    });
  } catch (error) {
    logger.error("FlowPay Test Charge Error:", error);
    res.status(500).json({ success: false, error: error.message });
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
