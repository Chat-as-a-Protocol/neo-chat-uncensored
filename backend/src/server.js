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
import { ledgerService } from "./services/ledger.js";
import { estimateTokensFromChunk } from "./utils/billing.js";
import { query } from "./utils/db.js";

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
  : ["http://localhost:4321", "https://laughter.up.railway.app"];

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

      try {
        if (
          !crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
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
      const payload = JSON.parse(req.body.toString());
      const { event, data } = payload;

      if (event === "FLOWPAY:PAYMENT_RECEIVED") {
        const { userId, paymentId } = data;

        if (!userId) {
          throw new Error("Missing userId in payload");
        }

        const reference = paymentId || `flowpay_${Date.now()}`;

        // Idempotency: check if this event was already processed
        const lockKey = `webhook_processed:${reference}`;
        const isNew = await redis.set(lockKey, "1", "NX", "EX", 86400); // 24h lock
        if (!isNew) {
          logger.info(`[Webhook] Event ${reference} already processed (Redis lock)`);
          return res.status(200).json({ status: "success", message: "Already processed" });
        }

        // Atualiza o tier no Redis (Operação Idempotente por natureza no Redis)
        await redis.set(`tier:${userId}`, "premium");

        // Adiciona créditos no ledger (Idempotente via ledgerService.addEntry)
        const entry = await ledgerService.addEntry(
          userId,
          100000, // 100k tokens para PREMIUM
          "PURCHASE",
          reference,
        );

        if (!entry) {
          logger.info(
            `[Webhook] Event ${reference} already processed for user ${userId} in ledger`,
          );
          return res.status(200).json({ status: "success", message: "Already processed" });
        }

        logger.info(`[Webhook] User ${userId} upgraded to PREMIUM via FlowPay (${reference})`);
        return res
          .status(200)
          .json({ status: "success", message: "Tier updated and credits added" });
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

// ===== AUTH MIDDLEWARE =====
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  // Bypass de Dev: apenas em ambiente de desenvolvimento
  if (process.env.NODE_ENV !== "production") {
    if (!token || token === "null") {
      req.user = { id: "dev_user", email: "dev@localhost", tier: "premium" };
      return next();
    }
  }

  const secret = effectiveJwtSecret;

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      if (process.env.NODE_ENV !== "production") {
        // Falhou assinatura, mas como estamos em dev, injeta o user fake
        req.user = { id: "dev_user", email: "dev@localhost", tier: "premium" };
        return next();
      }
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
      const userTier = (await redis.get(`tier:${req.user.id}`)) || "free";
      return userTier === "premium" ? 60 : 10; // 60 req/min para premium, 10 para free
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
  const usage = await ledgerService.getDailyUsage(req.user.id, today);
  const limit = parseInt((await redis.get(`limit:${req.user.id}`)) || "100");

  if (usage >= limit) {
    logger.warn(`[Quota] Limit exceeded for user ${req.user.id}: ${usage}/${limit}`);
    return res.status(403).json({
      error: "Daily quota exceeded",
      usage,
      limit,
      upgradeUrl: "/billing",
    });
  }

  req.currentUsage = usage;
  req.dailyLimit = limit;
  next();
};

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
      } = req.body;

      // Validar input
      const schema = z.object({
        messages: z
          .array(
            z.object({
              role: z.enum(["system", "user", "assistant"]),
              content: z.string().min(1).max(32000),
            }),
          )
          .max(50),
        model: z.string().optional(),
        stream: z.boolean().optional(),
      });

      schema.parse(req.body);

      // Carregar Persona NØX.ai
      let systemPrompt = "";
      try {
        const promptPath = path.resolve(
          process.cwd(),
          "..",
          "docs",
          "SYSTEM_PROMPT.md",
        );
        systemPrompt = await fs.readFile(promptPath, "utf-8");
      } catch (err) {
        logger.warn("Could not load SYSTEM_PROMPT.md, using empty fallback.");
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
              max_tokens: 4096,
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
        let tokenCount = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          res.write(chunk);

          // Estimar tokens para billing via utilitário
          tokenCount += estimateTokensFromChunk(chunk);
        }

        // Registrar consumo no ledger (assíncrono, não bloqueia)
        ledgerService
          .addEntry(
            req.user.id,
            -Math.max(1, tokenCount),
            "CONSUMPTION",
            "venice_stream_" + randomUUID(),
          )
          .catch((err) => logger.error("Ledger error:", err));

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

    const { data } = await veniceResponse.json();
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
  const usage = await ledgerService.getDailyUsage(req.user.id, today);
  const limit = (await redis.get(`limit:${req.user.id}`)) || 100;
  const tier = (await redis.get(`tier:${req.user.id}`)) || "free";

  res.json({
    today: parseInt(usage),
    limit: parseInt(limit),
    tier,
    remaining: parseInt(limit) - parseInt(usage),
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
  try {
    const flowpayUrl =
      process.env.FLOWPAY_API_URL || "https://api.flowpay.cash";
    const apiKey = process.env.FLOWPAY_API_KEY;

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
        amount: 49, // Valor fixo do Pro Engine no MVP
        currency: "BRL",
        orderId: `nox_${randomUUID()}`,
        userId: req.user.id,
        callbackUrl: `${frontendBaseUrl}/success`,
        metadata: {
          plan: "premium",
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

// ===== START SERVER =====
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
