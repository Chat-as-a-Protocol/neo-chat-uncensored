import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import { createLogger, format, transports } from "winston";
import { z } from "zod";

import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ===== STARTUP VALIDATION =====
if (process.env.NODE_ENV === "production") {
  const required = ["JWT_SECRET", "VENICE_API_KEY", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "FRONTEND_URL"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missing.join(", ")}`);
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
  console.warn("WARNING: JWT_SECRET is not set. Using a random ephemeral secret — tokens will be invalidated on restart. DO NOT use in production.");
}
// Use a random ephemeral secret in development if JWT_SECRET is not configured.
// In production this is guaranteed non-null by startup validation above.
const effectiveJwtSecret = JWT_SECRET || crypto.randomUUID();

const app = express();

// ===== MOCK REDIS PARA DESENVOLVIMENTO (Zero Docker) =====
// Se estiver rodando no Railway (onde existe REDIS_URL real), usa o ioredis normal.
// Localmente, ele usa um objeto de memória para não depender de banco instalado!
let redis;
if (process.env.NODE_ENV === "production" || process.env.REDIS_URL?.includes("railway")) {
  redis = new Redis(process.env.REDIS_URL);
} else {
  const store = new Map();
  redis = {
    get: async (k) => store.get(k) ?? null,
    setex: async (k, sec, v) => { store.set(k, v); setTimeout(() => store.delete(k), sec * 1000); },
    incr: async (k) => { const v = (parseInt(store.get(k)) || 0) + 1; store.set(k, v.toString()); return v; },
    incrby: async (k, a) => { const v = (parseInt(store.get(k)) || 0) + a; store.set(k, v.toString()); return v; },
    decr: async (k) => { const v = (parseInt(store.get(k)) || 0) - 1; store.set(k, v.toString()); return v; },
    expire: async () => {},
    del: async (k) => { store.delete(k); return 1; },
    multi: () => {
      const ops = [];
      const chain = {
        incr: function(k) { ops.push({ op: 'incr', k }); return chain; },
        pexpire: function(k, ms) { ops.push({ op: 'pexpire', k, ms }); return chain; },
        exec: async function() {
          const results = [];
          for (const { op, k, ms } of ops) {
            if (op === 'incr') {
              const v = (parseInt(store.get(k)) || 0) + 1;
              store.set(k, v.toString());
              results.push([null, v]);
            } else if (op === 'pexpire') {
              setTimeout(() => store.delete(k), ms);
              results.push([null, 1]);
            }
          }
          return results;
        }
      };
      return chain;
    }
  };
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_fake");

// Logger
const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "app.log" }),
  ],
});

app.use(helmet());
app.use(cors({ 
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : "http://localhost:4321",
  credentials: true
}));
app.use(express.json());

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
    handler: (req, res) => {
      res.status(429).json({
        error: "Rate limit exceeded",
        upgradeUrl: "/upgrade",
      });
    },
    store: {
      incr: async (key) => {
        const multi = redis.multi();
        multi.incr(key);
        multi.pexpire(key, 60000);
        const results = await multi.exec();
        return results[0][1];
      },
      decrement: (key) => redis.decr(key),
      resetKey: (key) => redis.del(key),
    },
  });

// ===== CHECK QUOTA MIDDLEWARE =====
const checkQuota = async (req, res, next) => {
  const today = new Date().toISOString().split("T")[0];
  const key = `usage:${req.user.id}:${today}`;
  const usage = parseInt((await redis.get(key)) || "0");
  const limit = parseInt((await redis.get(`limit:${req.user.id}`)) || "100");

  if (usage >= limit) {
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
        model: z.string(),
        stream: z.boolean().optional(),
      });

      schema.parse(req.body);

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
              messages,
              temperature,
              stream,
              max_tokens: 4096,
              venice_parameters: {
                include_venice_system_prompt: false, // Usa só seu system prompt
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

          // Estimar tokens para billing (simplificado)
          tokenCount += chunk
            .split("\n")
            .filter((l) => l.includes("content")).length;
        }

        // Incrementar quota usada (assíncrono, não bloqueia)
        const today = new Date().toISOString().split("T")[0];
        redis.incr(`usage:${req.user.id}:${today}`);
        redis.expire(`usage:${req.user.id}:${today}`, 86400);

        res.end();
      } else {
        // Modo não-streaming
        const data = await veniceResponse.json();

        // Contar tokens aproximados
        const tokens = data.usage?.total_tokens || 0;
        const today = new Date().toISOString().split("T")[0];
        redis.incrby(`usage:${req.user.id}:${today}`, tokens);
        redis.expire(`usage:${req.user.id}:${today}`, 86400);

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
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ===== MODELOS DISPONÍVEIS =====
app.get("/api/models", authenticateToken, async (req, res) => {
  try {
    const userTier = (await redis.get(`tier:${req.user.id}`)) || "free";

    // Puxa os modelos reais da API da Venice (somente text)
    const veniceResponse = await fetch("https://api.venice.ai/api/v1/models?type=text", {
      headers: {
        Authorization: `Bearer ${process.env.VENICE_API_KEY}`,
      },
    });

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
      defaultModel: process.env.VENICE_MODEL || "venice-uncensored-1-2"
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
  // Simplificado - em produção use bcrypt e DB real
  const userId = "user_" + Buffer.from(email).toString("base64");

  const token = jwt.sign(
    { id: userId, email, tier: "free" },
    effectiveJwtSecret,
    { expiresIn: "7d" },
  );

  res.json({ token, user: { id: userId, email, tier: "free" } });
});

app.post("/api/auth/signup", authLimiter, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid signup data. Password must be at least 8 characters." });
  }

  const { email, name } = parsed.data;
  // Simplificado - em produção use bcrypt e DB real
  const userId = "user_" + Buffer.from(email).toString("base64");

  const token = jwt.sign(
    { id: userId, email, name, tier: "free" },
    effectiveJwtSecret,
    { expiresIn: "7d" },
  );

  res.status(201).json({ token, user: { id: userId, email, name, tier: "free" } });
});

// ===== STRIPE CHECKOUT =====
app.post("/stripe/create-checkout", authenticateToken, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      client_reference_id: req.user.id,
      mode: "subscription",
      payment_method_types: ["card"], // Removido 'crypto' pois requer configuração específica
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_PRO,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/upgrade`,
      subscription_data: {
        metadata: { userId: req.user.id },
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    logger.error("Stripe error:", error);
    res.status(500).json({ error: "Payment failed" });
  }
});

// ===== STRIPE WEBHOOK =====
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.post(
  "/webhooks/stripe",
  webhookLimiter,
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      logger.warn("Stripe webhook signature verification failed:", err.message);
      return res.status(400).send("Webhook Error: Invalid signature");
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.client_reference_id;

      // Atualizar para premium
      await redis.setex(`tier:${userId}`, 2592000, "premium"); // 30 dias
      await redis.setex(`limit:${userId}`, 2592000, "10000"); // 10k tokens/dia

      logger.info(`User ${userId} upgraded to premium`);
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId;

      if (userId) {
        await redis.del(`tier:${userId}`);
        await redis.del(`limit:${userId}`);
        logger.info(`User ${userId} subscription cancelled, reverted to free`);
      }
    }

    res.json({ received: true });
  },
);

// ===== USAGE STATS =====
app.get("/api/usage", authenticateToken, async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const usage = (await redis.get(`usage:${req.user.id}:${today}`)) || 0;
  const limit = (await redis.get(`limit:${req.user.id}`)) || 100;
  const tier = (await redis.get(`tier:${req.user.id}`)) || "free";

  res.json({
    today: parseInt(usage),
    limit: parseInt(limit),
    tier,
    remaining: parseInt(limit) - parseInt(usage),
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
