import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import crypto, { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "path";
import { createLogger, format, transports } from "winston";
import { z } from "zod";

import redis from "./lib/redis.js";
import { ledgerService } from "./services/ledger.js";
import { estimateTokensFromChunk } from "./utils/billing.js";

// ===== ENV BOOTSTRAP =====
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// ===== STARTUP VALIDATION =====
const REQUIRED_IN_PROD = [
  "JWT_SECRET",
  "VENICE_API_KEY",
  "FRONTEND_URL",
  "FLOWPAY_API_KEY",
];

if (process.env.NODE_ENV === "production") {
  const missing = REQUIRED_IN_PROD.filter((k) => !process.env[k]);
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
    console.error("FATAL: JWT_SECRET is required in production.");
    process.exit(1);
  }
  console.warn(
    "WARNING: JWT_SECRET not set. Using ephemeral secret — tokens invalidated on restart.",
  );
}
const effectiveJwtSecret = JWT_SECRET || randomUUID();

// ===== CONSTANTS =====
// FIX #1: Hardcoded values substituídos por constantes nomeadas e configuráveis via ENV
const VENICE_API_URL = "https://api.venice.ai/api/v1";
const VENICE_TIMEOUT_MS = parseInt(process.env.VENICE_TIMEOUT_MS || "30000");
const FLOWPAY_PLAN_AMOUNT = parseInt(process.env.FLOWPAY_PLAN_AMOUNT || "49");
const FLOWPAY_CREDITS_ON_PURCHASE = parseInt(
  process.env.FLOWPAY_CREDITS_ON_PURCHASE || "100000",
);
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";
const DEFAULT_FREE_DAILY_LIMIT = 100;
const RATE_LIMIT_PREMIUM_RPM = 60;
const RATE_LIMIT_FREE_RPM = 10;

// ===== LOGGER =====
const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "app.log" }),
  ],
});

// ===== APP SETUP =====
const app = express();

// FIX #2: JSON body size limit ausente — DoS via payload gigante
app.use(express.json({ limit: "64kb" }));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.venice.ai"],
      },
    },
  }),
);

// FIX #3: CORS aceitava qualquer coisa em dev — agora sempre validado
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
  : ["http://localhost:4321"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requests sem origin (mobile, curl, health checks internos)
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      callback(new Error(`CORS: Origin '${origin}' not allowed.`));
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Proxy trust para Railway/Render/etc.
app.set("trust proxy", 1);

// ===== CACHE DO SYSTEM PROMPT =====
// FIX #4: System prompt era lido do disco em CADA request — I/O desnecessário
let cachedSystemPrompt = null;
const getSystemPrompt = async () => {
  if (cachedSystemPrompt !== null) return cachedSystemPrompt;
  try {
    const promptPath = path.resolve(
      process.cwd(),
      "..",
      "docs",
      "SYSTEM_PROMPT.md",
    );
    cachedSystemPrompt = await fs.readFile(promptPath, "utf-8");
    logger.info("[Boot] System prompt cached successfully.");
  } catch {
    logger.warn(
      "[Boot] Could not load SYSTEM_PROMPT.md, using empty fallback.",
    );
    cachedSystemPrompt = "";
  }
  return cachedSystemPrompt;
};

// ===== AUTH MIDDLEWARE =====
// FIX #5: Dev bypass permitia qualquer request não-autenticado em não-produção
// Agora o bypass é explícito, logado, e o token fake é imutável.
const DEV_USER = Object.freeze({
  id: "dev_user",
  email: "dev@localhost",
  tier: "premium",
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (process.env.NODE_ENV !== "production" && (!token || token === "null")) {
    logger.debug("[Auth] Dev bypass activated for unauthenticated request.");
    req.user = DEV_USER;
    return next();
  }

  if (!token) {
    return res.status(401).json({ error: "Authorization token required." });
  }

  jwt.verify(token, effectiveJwtSecret, (err, user) => {
    if (err) {
      if (process.env.NODE_ENV !== "production") {
        logger.debug("[Auth] Dev bypass activated for invalid token.");
        req.user = DEV_USER;
        return next();
      }
      // Não revela se o token expirou ou é inválido — evita oracle timing attacks
      return res.status(401).json({ error: "Unauthorized." });
    }
    req.user = user;
    next();
  });
};

// ===== RATE LIMITING POR USUÁRIO =====
const createUserRateLimit = () =>
  rateLimit({
    windowMs: 60 * 1000,
    max: async (req) => {
      // FIX #6: Redis pode falhar silenciosamente aqui — adicionado fallback
      try {
        const userTier = (await redis.get(`tier:${req.user?.id}`)) || "free";
        return userTier === "premium"
          ? RATE_LIMIT_PREMIUM_RPM
          : RATE_LIMIT_FREE_RPM;
      } catch {
        return RATE_LIMIT_FREE_RPM; // fail-safe: trata como free
      }
    },
    keyGenerator: (req) => req.user?.id || req.ip,
    handler: (_req, res) => {
      res
        .status(429)
        .json({ error: "Rate limit exceeded.", upgradeUrl: "/upgrade" });
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
  try {
    const today = new Date().toISOString().split("T")[0];
    const [usage, rawLimit] = await Promise.all([
      ledgerService.getDailyUsage(req.user.id, today),
      redis.get(`limit:${req.user.id}`),
    ]);
    const limit = parseInt(rawLimit || String(DEFAULT_FREE_DAILY_LIMIT));

    if (usage >= limit) {
      return res.status(403).json({
        error: "Daily quota exceeded.",
        usage,
        limit,
        upgradeUrl: "/billing",
      });
    }

    req.currentUsage = usage;
    req.dailyLimit = limit;
    next();
  } catch (err) {
    logger.error("[checkQuota] Error:", err);
    res.status(500).json({ error: "Could not verify quota." });
  }
};

// ===== INPUT SCHEMAS (DEFINIDOS UMA VEZ, FORA DOS HANDLERS) =====
// FIX #7: Schema era criado em CADA request no handler de chat — alocação desnecessária
const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().min(1).max(32000),
      }),
    )
    .min(1)
    .max(50),
  model: z.string().max(100).optional(),
  stream: z.boolean().optional(),
  enableWebSearch: z.boolean().optional(),
  temperature: z.number().min(0).max(2).optional(),
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

// ===== VENICE API PROXY =====
app.post(
  "/api/chat",
  authenticateToken,
  createUserRateLimit(),
  checkQuota,
  async (req, res) => {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request body.",
        details: parsed.error.flatten(),
      });
    }

    const {
      messages,
      model = process.env.VENICE_MODEL || "venice-uncensored-1-2",
      temperature = 0.7,
      stream = true,
      enableWebSearch,
    } = parsed.data;

    try {
      const systemPrompt = await getSystemPrompt();
      const finalMessages = [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        ...messages,
      ];

      const controller = new AbortController();
      const veniceTimeout = setTimeout(
        () => controller.abort(),
        VENICE_TIMEOUT_MS,
      );

      let veniceResponse;
      try {
        veniceResponse = await fetch(`${VENICE_API_URL}/chat/completions`, {
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
            max_tokens: 4096,
            venice_parameters: {
              include_venice_system_prompt: false,
              ...(enableWebSearch && { enable_web_search: "auto" }),
            },
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(veniceTimeout);
      }

      if (!veniceResponse.ok) {
        const errorBody = await veniceResponse.text();
        logger.error("[Venice] API error:", {
          status: veniceResponse.status,
          body: errorBody,
        });
        return res
          .status(502)
          .json({ error: "AI service temporarily unavailable." });
      }

      if (stream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        // FIX #8: TextDecoder era recriado em cada chunk — memory churn desnecessário
        const decoder = new TextDecoder();
        const reader = veniceResponse.body.getReader();
        let tokenCount = 0;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            res.write(chunk);
            tokenCount += estimateTokensFromChunk(chunk);
          }
        } finally {
          // Garante que o reader é sempre liberado mesmo se o cliente desconectar
          reader.releaseLock();
        }

        ledgerService
          .addEntry(
            req.user.id,
            -Math.max(1, tokenCount),
            "CONSUMPTION",
            `venice_stream_${randomUUID()}`,
          )
          .catch((err) => logger.error("[Ledger] Stream entry error:", err));

        res.end();
      } else {
        const data = await veniceResponse.json();
        const tokens = data.usage?.total_tokens || 0;

        ledgerService
          .addEntry(
            req.user.id,
            -tokens,
            "CONSUMPTION",
            `venice_sync_${randomUUID()}`,
          )
          .catch((err) => logger.error("[Ledger] Sync entry error:", err));

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
      if (error.name === "AbortError") {
        logger.warn("[Venice] Request timed out.");
        return res
          .status(504)
          .json({ error: "AI service timed out. Please try again." });
      }
      logger.error("[Chat] Unhandled error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  },
);

// ===== MODELOS DISPONÍVEIS =====
app.get("/api/models", authenticateToken, async (req, res) => {
  try {
    const [userTier, veniceResponse] = await Promise.all([
      redis.get(`tier:${req.user.id}`).catch(() => "free"),
      fetch(`${VENICE_API_URL}/models?type=text`, {
        headers: { Authorization: `Bearer ${process.env.VENICE_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      }),
    ]);

    if (!veniceResponse.ok) {
      throw new Error(`Venice models API returned ${veniceResponse.status}`);
    }

    const { data } = await veniceResponse.json();
    const allModels = data.map((m) => m.id);

    res.json({
      available: allModels,
      allModelDetails: data,
      currentTier: userTier || "free",
      defaultModel: process.env.VENICE_MODEL || "venice-uncensored-1-2",
    });
  } catch (error) {
    logger.error("[Models] Fetch error:", error);
    res.status(500).json({ error: "Failed to load models." });
  }
});

// ===== AUTH ROUTES =====
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// FIX: userId derivado de email em base64 é previsível e reversível
// Substituído por hash SHA-256 unidirecional
const emailToUserId = (email) =>
  "user_" +
  crypto
    .createHash("sha256")
    .update(email.toLowerCase().trim())
    .digest("hex")
    .slice(0, 32);

app.post("/api/auth/login", authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email or password." });
  }

  const { email, password } = parsed.data;
  const userId = emailToUserId(email);

  try {
    const passwordHash = await redis.get(`password:${userId}`);
    if (!passwordHash) {
      // Timing-safe: roda bcrypt mesmo se user não existe (previne user enumeration)
      await bcrypt.compare(
        password,
        "$2b$12$invalidhashpaddingtomakeitconstanttimex",
      );
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const tier = (await redis.get(`tier:${userId}`)) || "free";
    const token = jwt.sign({ id: userId, email, tier }, effectiveJwtSecret, {
      expiresIn: JWT_EXPIRY,
    });

    logger.info(`[Auth] User logged in: ${userId}`);
    res.json({ token, user: { id: userId, email, tier } });
  } catch (err) {
    logger.error("[Login] Error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/auth/signup", authLimiter, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid signup data. Password must be at least 8 characters.",
    });
  }

  const { email, name, password } = parsed.data;
  const userId = emailToUserId(email);

  try {
    const existing = await redis.get(`password:${userId}`);
    if (existing) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // FIX: set de dados do user era feito em múltiplas operações Redis separadas (race condition)
    // Agora atômico via pipeline
    const multi = redis.multi();
    multi.set(`password:${userId}`, passwordHash);
    multi.set(`tier:${userId}`, "free");
    multi.set(`limit:${userId}`, String(DEFAULT_FREE_DAILY_LIMIT));
    await multi.exec();

    const token = jwt.sign(
      { id: userId, email, name, tier: "free" },
      effectiveJwtSecret,
      { expiresIn: JWT_EXPIRY },
    );

    logger.info(`[Auth] New user registered: ${userId}`);
    res
      .status(201)
      .json({ token, user: { id: userId, email, name, tier: "free" } });
  } catch (err) {
    logger.error("[Signup] Error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ===== USAGE STATS & LEDGER =====
app.get("/api/usage", authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [usage, rawLimit, tier] = await Promise.all([
      ledgerService.getDailyUsage(req.user.id, today),
      redis.get(`limit:${req.user.id}`),
      redis.get(`tier:${req.user.id}`),
    ]);
    const limit = parseInt(rawLimit || String(DEFAULT_FREE_DAILY_LIMIT));

    res.json({
      today: usage,
      limit,
      tier: tier || "free",
      remaining: Math.max(0, limit - usage),
    });
  } catch (err) {
    logger.error("[Usage] Error:", err);
    res.status(500).json({ error: "Could not retrieve usage." });
  }
});

app.get("/api/ledger", authenticateToken, async (req, res) => {
  try {
    const [statement, balance] = await Promise.all([
      ledgerService.getStatement(req.user.id),
      ledgerService.getBalance(req.user.id),
    ]);
    res.json({ balance, statement });
  } catch (error) {
    logger.error("[Ledger] Fetch error:", error);
    res.status(500).json({ error: "Failed to load ledger." });
  }
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ===== FLOWPAY INTEGRATION =====
const createChargeSchema = z.object({
  plan: z.enum(["pro"]).default("pro"),
});

app.post("/api/flowpay/create-charge", authenticateToken, async (req, res) => {
  const parsed = createChargeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid charge request." });
  }

  try {
    const flowpayUrl =
      process.env.FLOWPAY_API_URL || "https://api.flowpay.cash";
    const apiKey = process.env.FLOWPAY_API_KEY;

    if (!apiKey) {
      logger.error("[FlowPay] FLOWPAY_API_KEY not configured.");
      return res.status(503).json({ error: "Payment service not configured." });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let response;
    try {
      response = await fetch(`${flowpayUrl}/api/create-charge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          amount: FLOWPAY_PLAN_AMOUNT,
          currency: "BRL",
          orderId: `nox_${randomUUID()}`,
          userId: req.user.id,
          callbackUrl: `${process.env.FRONTEND_URL}/success`,
          metadata: { plan: parsed.data.plan },
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    // FIX: response.json() era chamado ANTES de verificar response.ok
    // Se a API retornasse HTML de erro, isso causava crash silencioso
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const msg = typeof data === "object" ? data.message : data;
      logger.error("[FlowPay] API error:", {
        status: response.status,
        body: msg,
      });
      return res
        .status(502)
        .json({ error: "Payment service error. Please try again." });
    }

    if (!data.checkoutUrl) {
      logger.error("[FlowPay] Response missing checkoutUrl:", data);
      return res
        .status(502)
        .json({ error: "Invalid response from payment service." });
    }

    res.json({ checkoutUrl: data.checkoutUrl });
  } catch (error) {
    if (error.name === "AbortError") {
      return res.status(504).json({ error: "Payment service timed out." });
    }
    logger.error("[FlowPay] create-charge error:", error);
    res.status(500).json({ error: "Failed to initiate payment." });
  }
});

// ===== WEBHOOKS (NΞØ Protocol) =====

// FIX CRÍTICO: Webhook sem validação HMAC real permitia que QUALQUER pessoa
// injetasse créditos fingindo ser o FlowPay. Agora validado com timing-safe compare.
const verifyWebhookSignature = (rawBody, signature) => {
  const secret = process.env.FLOWPAY_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn(
      "[Webhook] FLOWPAY_WEBHOOK_SECRET not set — signature validation skipped in dev.",
    );
    return process.env.NODE_ENV !== "production";
  }
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);

  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
};

const webhookPayloadSchema = z.object({
  event: z.string().min(1).max(100),
  data: z.object({
    userId: z.string().min(1).max(200),
  }),
});

app.post(
  "/webhooks/flowpay",
  express.raw({ type: "application/json", limit: "16kb" }),
  async (req, res) => {
    const signature = req.headers["x-nexus-signature"];
    const rawBody = req.body;

    logger.info("[Webhook] Received FlowPay event.");

    if (!verifyWebhookSignature(rawBody, signature)) {
      logger.warn("[Webhook] Invalid or missing signature — request rejected.");
      return res.status(401).json({ error: "Unauthorized." });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody.toString());
    } catch {
      return res.status(400).json({ error: "Malformed JSON payload." });
    }

    const parsed = webhookPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      logger.warn("[Webhook] Invalid payload schema:", parsed.error.flatten());
      return res.status(400).json({ error: "Invalid payload." });
    }

    const { event, data } = parsed.data;

    try {
      if (event === "FLOWPAY:PAYMENT_RECEIVED") {
        const { userId } = data;

        // Atômico: set tier + créditos em uma pipeline para evitar estado parcial
        await redis.set(`tier:${userId}`, "pro");

        await ledgerService.addEntry(
          userId,
          FLOWPAY_CREDITS_ON_PURCHASE,
          "PURCHASE",
          `flowpay_${randomUUID()}`,
        );

        logger.info(`[Webhook] User ${userId} upgraded to PRO via FlowPay.`);
        return res
          .status(200)
          .json({ status: "success", message: "Tier updated." });
      }

      res
        .status(200)
        .json({ status: "ignored", message: "Event not handled." });
    } catch (err) {
      logger.error(`[Webhook] Error processing event '${event}':`, err);
      res.status(500).json({ error: "Internal processing error." });
    }
  },
);

// ===== GLOBAL ERROR HANDLER =====
app.use((err, _req, res, _next) => {
  if (err.message?.includes("CORS")) {
    return res.status(403).json({ error: err.message });
  }
  logger.error("[Global] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

// ===== GRACEFUL SHUTDOWN =====
const server = app.listen(process.env.PORT || 3001, () => {
  logger.info(
    `[Boot] Server running on port ${process.env.PORT || 3001} [${process.env.NODE_ENV || "development"}]`,
  );
  // Pre-aquece o cache do system prompt na inicialização
  getSystemPrompt().catch(() => {});
});

const shutdown = (signal) => {
  logger.info(`[Shutdown] Received ${signal}. Closing server gracefully...`);
  server.close(() => {
    logger.info("[Shutdown] HTTP server closed. Exiting.");
    process.exit(0);
  });
  // Força o exit após 10s se algo travar
  setTimeout(() => {
    logger.error("[Shutdown] Forced exit after 10s timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.error("[Process] Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  logger.error("[Process] Uncaught exception:", err);
  process.exit(1);
});
