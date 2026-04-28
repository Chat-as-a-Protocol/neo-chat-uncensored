# This file is a merged representation of the entire codebase, combined into a single document by Repomix

## File Summary

## Purpose

This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format

The content is organized as follows:

1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines

- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes

- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Empty lines have been removed from all files
- Files are sorted by Git change count (files with more changes are at the bottom)

## Directory Structure

```structure
.github/
  prompts/
    commit-message.md
    pr-review.md
  workflows/
    context-lint.yml
backend/
  src/
    server.js
  .env.example
  package.json
  railway.json
docs/
  API.md
  ARCHITECTURE.md
  CHANGELOG.md
  CONSTRAINTS.md
  CONTEXT.md
  DEPLOY.md
  PAYMENTS.md
  SYSTEM_PROMPT.md
public/
  favicon.svg
  logo.svg
  neo-chat-uncensored-banner.svg
scripts/
  context-check.mjs
src/
  components/
    ui/
      Button.astro
      Card.astro
      Input.astro
    AstroChatInterface.astro
    SceneBackground.astro
  layouts/
    Layout.astro
  pages/
    index.astro
    login.astro
    privacy-policy.astro
    signup.astro
    success.astro
    terms-and-conditions.astro
    upgrade.astro
  env.d.ts
.cursorrules
.env.example
.gitignore
astro.config.mjs
Makefile
NEXTSTEPS.md
package.json
pnpm-workspace.yaml
railway.json
README.md
start.sh
tailwind.config.mjs
tsconfig.json
```

## Files

## File: .github/prompts/commit-message.md

````markdown
# Commit Message Protocol · NΞØ

Você é um Engenheiro de Contexto da NΞØ Protocol. Sua tarefa é gerar mensagens de commit que não sejam apenas descritivas, mas que sirvam como trilhas de auditoria para a integridade do sistema.

## Regras de Ouro

1. **Padrão Semântico**: Use estritamente [Conventional Commits](https://www.conventionalcommits.org/).
2. **Contexto é Tudo**: Explique o "porquê", não apenas o "o quê".
3. **Purity First**: Garanta que mudanças de arquitetura sejam destacadas.

## Tipos Permitidos

- `feat:` Nova funcionalidade (ex: Migração para Astro).
- `fix:` Correção de bug (ex: Parse de chunks SSE).
- `docs:` Alterações em documentação ou manifestos.
- `style:` Formatação, pontos e vírgulas (sem alteração de lógica).
- `refactor:` Mudança de código que não corrige bug nem adiciona feature.
- `perf:` Mudança de código que melhora performance (foco principal NΞØ).
- `chore:` Manutenção de builds, dependências, etc.

## Estrutura da Mensagem

```text
<tipo>(<escopo>): <descrição curta em português>

[CORPO]
- Detalhe técnico 1
- Detalhe técnico 2
- Racional da mudança

[NOTAS DE RODAPÉ]
BREAKING CHANGE: <descrição se houver>
See: #123 (opcional)
```

## Exemplo NΞØ

```text
feat(frontend): migração completa para Astro e Vanilla JS

- Removido React, Framer Motion e Zustand para ganho de performance.
- Implementado AstroChatInterface com parsing de SSE manual.
- Estilização mantida via Tailwind CSS puro.
- Removido ParticleBackground para evitar erros de WebGL/Sandbox.

BREAKING CHANGE: O frontend não utiliza mais React; componentes .tsx foram depreciados.
```
````

## File: .github/prompts/pr-review.md

````markdown
# Pull Request Review Protocol · NΞØ

Você é o Arquiteto de Software Sênior da NΞØ Protocol. Seu objetivo é garantir que nenhuma linha de código "bloated" ou insegura entre no core do sistema.

## Checklist de Revisão

### 1. Performance (O Filtro NΞØ)

- O código adiciona dependências desnecessárias? (React, bibliotecas pesadas de UI, etc.)
- Há manipulação excessiva do DOM no cliente?
- O carregamento é "Zero JS" ou o mais próximo possível disso?

### 2. Integridade de Contexto

- A mudança reflete o que está nos manifestos (`neo-ai/manifests/`)?
- Se houve mudança de arquitetura, o `integrations.json` ou `repos.json` foi atualizado?
- Os comentários explicam o "racional" de decisões complexas?

### 3. Segurança & Resiliência

- Inputs do usuário são validados (ex: Zod, Joi)?
- Erros de rede (fetch/SSE) são tratados com retries ou logs adequados?
- Há vazamento de segredos (.env) ou keys no código?

### 4. Estética & Padrões

- Segue a estética "Glassmorphism/Cyberpunk" definida?
- Usa Tailwind CSS de forma limpa e sem duplicidade?

## Tom de Voz

- Seja direto, técnico e pragmático.
- Se algo estiver ruim, diga "Isso não é NΞØ" e explique o porquê.
- Elogie soluções elegantes que simplificam o sistema.

## Estrutura da Resposta

1. **Sumário Executivo**: Aprovado, Comentários ou Rejeitado.
2. **Pontos Positivos**: O que foi bem feito.
3. **Bloqueios (Critical)**: O que impede o merge.
4. **Sugestões (Non-critical)**: Melhorias de estilo ou performance futura.
````

## File: .github/workflows/context-lint.yml

````yaml
name: Context Lint
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
jobs:
  lint-context:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Run Context Check
        run: node scripts/context-check.mjs
````

## File: backend/src/server.js

````javascript
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
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
// ===== MOCK REDIS PARA DESENVOLVIMENTO (Zero Docker) =====
// Se estiver rodando no Railway (onde existe REDIS_URL real), usa o ioredis normal.
// Localmente, ele usa um objeto de memória para não depender de banco instalado!
let redis;
if (
  process.env.NODE_ENV === "production" ||
  process.env.REDIS_URL?.includes("railway")
) {
  redis = new Redis(process.env.REDIS_URL);
} else {
  const store = new Map();
  redis = {
    get: async (k) => store.get(k) ?? null,
    set: async (k, v) => {
      store.set(k, v);
      return "OK";
    },
    setex: async (k, sec, v) => {
      store.set(k, v);
      setTimeout(() => store.delete(k), sec * 1000);
      return "OK";
    },
    incr: async (k) => {
      const v = (parseInt(store.get(k)) || 0) + 1;
      store.set(k, v.toString());
      return v;
    },
    incrby: async (k, a) => {
      const v = (parseInt(store.get(k)) || 0) + a;
      store.set(k, v.toString());
      return v;
    },
    decr: async (k) => {
      const v = (parseInt(store.get(k)) || 0) - 1;
      store.set(k, v.toString());
      return v;
    },
    expire: async () => {},
    del: async (k) => {
      store.delete(k);
      return 1;
    },
    multi: () => {
      const ops = [];
      const chain = {
        incr: function (k) {
          ops.push({ op: "incr", k });
          return chain;
        },
        pexpire: function (k, ms) {
          ops.push({ op: "pexpire", k, ms });
          return chain;
        },
        exec: async function () {
          const results = [];
          for (const { op, k, ms } of ops) {
            if (op === "incr") {
              const v = (parseInt(store.get(k)) || 0) + 1;
              store.set(k, v.toString());
              results.push([null, v]);
            } else if (op === "pexpire") {
              setTimeout(() => store.delete(k), ms);
              results.push([null, 1]);
            }
          }
          return results;
        },
      };
      return chain;
    },
  };
}
// Logger
const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "app.log" }),
  ],
});
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",")
      : "http://localhost:4321",
    credentials: true,
  }),
);
// Trust the first proxy hop (Railway, etc.) so req.ip is the real client IP,
// which is required for express-rate-limit to work correctly behind a reverse proxy.
app.set("trust proxy", 1);
// ===== STRIPE WEBHOOK =====
// IMPORTANT: registered BEFORE express.json() so the raw request body is
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
  const userId = "user_" + Buffer.from(email).toString("base64");
  const passwordHash = await redis.get(`password:${userId}`);
  if (!passwordHash) {
    return res.status(401).json({ error: "Invalid email or password." });
  }
  const valid = await bcrypt.compare(password, passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password." });
  }
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
    return res.status(400).json({
      error: "Invalid signup data. Password must be at least 8 characters.",
    });
  }
  const { email, name, password } = parsed.data;
  const userId = "user_" + Buffer.from(email).toString("base64");
  // Reject if account already exists
  const existing = await redis.get(`password:${userId}`);
  if (existing) {
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
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});
// ===== WEBHOOKS (NΞØ Protocol) =====
/**
 * Endpoint de Webhook para o FlowPay (via Nexus)
 * Recebe notificações de pagamento e atualiza o tier do usuário.
 */
app.post("/webhooks/flowpay", express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers["x-nexus-signature"];
  const secret = process.env.NEO_CHAT_WEBHOOK_SECRET;
  logger.info("[Webhook] Received FlowPay event from Nexus");
  // TODO: Implementar validação real de HMAC-SHA256 com o secret do Nexus
  if (!signature && process.env.NODE_ENV === "production") {
    logger.warn("[Webhook] Missing signature in production");
    return res.status(401).send("Unauthorized");
  }
  try {
    const payload = JSON.parse(req.body.toString());
    const { event, data } = payload;
    if (event === "FLOWPAY:PAYMENT_RECEIVED") {
      const { userId, plan } = data;
      if (!userId) {
        throw new Error("Missing userId in payload");
      }
      // Atualiza o tier no Redis
      await redis.set(`user:${userId}:tier`, "pro");
      // Adiciona créditos ou limpa quota se necessário
      await redis.del(`usage:${userId}:${new Date().toISOString().split('T')[0]}`);
      logger.info(`[Webhook] User ${userId} upgraded to PRO via FlowPay`);
      return res.status(200).json({ status: "success", message: "Tier updated" });
    }
    res.status(200).json({ status: "ignored", message: "Event not handled" });
  } catch (err) {
    logger.error(`[Webhook] Error processing event: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
// ===== START SERVER =====
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
````

## File: backend/.env.example

````keys
VENICE_API_KEY=sua_chave_aqui
VENICE_MODEL=llama-3.3-70b
JWT_SECRET=super_secret_key_min_32_chars
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:4321
````

## File: backend/package.json

````json
{
  "name": "chat-api-backend",
  "type": "module",
  "engines": {
    "node": ">=20.x"
  },
  "scripts": {
    "start": "node src/server.js",
    "dev": "node src/server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^8.0.0",
    "ioredis": "^5.3.2",
    "jsonwebtoken": "^9.0.2",
    "node-fetch": "^3.3.2",
    "stripe": "^14.9.0",
    "winston": "^3.11.0",
    "zod": "^3.22.4"
  }
}
````

## File: backend/railway.json

````json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install --frozen-lockfile"
  },
  "deploy": {
    "startCommand": "pnpm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/health"
  }
}
````

## File: docs/API.md

````markdown
<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->

```text
========================================
   NEO-CHAT-UNCENSORED · API REFERENCE
========================================
Base URL dev  : http://localhost:3001
Base URL prod : $PUBLIC_API_URL
Auth          : Bearer <neo_token> (JWT)
========================================
```

## ⟠ Chat

### `POST /api/chat`

Proxy para Venice AI com streaming SSE.

**Auth:** obrigatória  
**Rate limit:** 10 req/min (free) · 60 req/min (premium)  
**Quota:** verificada antes de cada request

**Body:**

```json
{
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "model": "venice-uncensored-1-2",
  "stream": true,
  "temperature": 0.7,
  "enableWebSearch": false
}
```

**Resposta (stream=true):** `text/event-stream` — formato SSE padrão OpenAI  
**Resposta (stream=false):** JSON com `{ ...veniceResponse, quota: { used, limit, remaining } }`

────────────────────────────────────────

## ⟠ Modelos

### `GET /api/models`

Lista modelos de texto disponíveis na Venice AI.

**Auth:** obrigatória

**Resposta:**

```json
{
  "available": ["venice-uncensored-1-2", "..."],
  "allModelDetails": [...],
  "currentTier": "free",
  "defaultModel": "venice-uncensored-1-2"
}
```

────────────────────────────────────────

## ⟠ Quota

### `GET /api/usage`

Consumo diário do usuário autenticado.

**Auth:** obrigatória

**Resposta:**

```json
{
  "today": 42,
  "limit": 100,
  "tier": "free",
  "remaining": 58
}
```

────────────────────────────────────────

## ⟠ Auth

### `POST /api/auth/signup`

**Rate limit:** 10 req / 15 min por IP

**Body:**

```json
{
  "name": "string (1–100)",
  "email": "string email válido",
  "password": "string (8–128 chars)"
}
```

**Resposta 201:**

```json
{
  "token": "<JWT 7d>",
  "user": { "id", "email", "name", "tier": "free" }
}
```

**Erros:** 400 (validação) · 409 (email já existe)

────────────────────────────────────────

### `POST /api/auth/login`

**Rate limit:** 10 req / 15 min por IP

**Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Resposta 200:**

```json
{
  "token": "<JWT 7d>",
  "user": { "id", "email", "tier" }
}
```

**Erros:** 400 (validação) · 401 (credenciais inválidas)

────────────────────────────────────────

## ⟠ Pagamentos (Fase 2 — FlowPay)

### `POST /flowpay/create-charge`

**Auth:** obrigatória

**Resposta:**

```json
{ "url": "https://flowpay.cash/checkout/..." }
```

### `POST /webhooks/flowpay`

Consumer interno do Nexus. Não chamado diretamente.  
Valida `X-Nexus-Signature` (HMAC-SHA256).  
Evento: `FLOWPAY:PAYMENT_RECEIVED`.
````

## File: docs/ARCHITECTURE.md

````markdown
<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->

```text
========================================
   NEO-CHAT-UNCENSORED · ARCHITECTURE
========================================
```

## ⟠ Topologia

```text
Browser
  └─ Astro 6 (output: static)
       ├─ /            → AstroChatInterface (streaming SSE)
       ├─ /login       → formulário + JWT storage
       ├─ /signup      → cadastro + auto-login
       ├─ /upgrade     → planos + checkout FlowPay
       └─ /success     → confirmação pós-pagamento

API Backend (Express / Railway)
  ├─ POST /api/chat           → proxy Venice AI (SSE stream)
  ├─ GET  /api/models         → lista modelos Venice
  ├─ GET  /api/usage          → quota diária do usuário
  ├─ POST /api/auth/login     → JWT (bcrypt verify)
  ├─ POST /api/auth/signup    → bcrypt hash + JWT
  ├─ POST /flowpay/create-charge → checkout FlowPay (Fase 2)
  └─ POST /webhooks/flowpay   → consumer Nexus (Fase 2)

Redis (Railway ou mock in-memory em dev)
  ├─ tier:{userId}            → "free" | "premium" (TTL 30d)
  ├─ limit:{userId}           → tokens/dia permitidos
  ├─ usage:{userId}:{date}    → tokens usados hoje
  └─ password:{userId}        → bcrypt hash da senha

Venice AI
  └─ POST /api/v1/chat/completions (SSE stream)
```

## ⧉ Fluxo de Dados — Chat

```text
1. Usuário digita mensagem
2. Frontend envia POST /api/chat com Bearer token
3. Backend: authenticateToken → checkQuota → createUserRateLimit
4. Backend proxy para Venice API (SSE)
5. Backend faz pipe do stream direto para o cliente
6. Frontend renderiza chunks incrementalmente
7. Backend incrementa quota no Redis (assíncrono)
```

## ⧇ Fluxo de Pagamento (Fase 2 — FlowPay)

```text
1. Usuário clica "Fazer Upgrade"
2. Frontend: POST /flowpay/create-charge → retorna URL
3. Usuário completa pagamento em flowpay.cash
4. FlowPay emite FLOWPAY:PAYMENT_RECEIVED para Nexus
5. Nexus entrega POST /webhooks/flowpay (X-Nexus-Signature)
6. Backend valida HMAC e atualiza tier:userId → "premium"
```

## ◬ Decisões de Arquitetura

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Frontend | Astro static | Performance extrema, sem JS desnecessário |
| Streaming | SSE nativo | Compatível com Venice, sem WebSocket |
| Auth | JWT + Redis | Sem banco de dados no MVP |
| Pagamentos | FlowPay via Nexus | Padrão canônico do ecossistema NEO |
| Dev local | Redis mock in-memory | Zero dependências de infraestrutura |
````

## File: docs/CHANGELOG.md

````markdown
<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# NΞØ · CONTEXT CHANGELOG

```text
========================================
     CHANGELOG · CONTEXT ENGINEERING
========================================
Status: ACTIVE
Version: v1.0.0
========================================
```

> **Registry:** Todas as mudanças significativas na ontologia, regras
> ou estrutura de contexto do projeto.

────────────────────────────────────────

## ⧖ [0.1.0] — 2026-04-22

### **Added**
- Estrutura inicial de Context Engineering.
- Estilização canônica via `MARKDOWN_STYLE_GUIDE.md`.
- `CONTEXT.md`: Identidade e Stack verificada.
- `CONSTRAINTS.md`: Guardrails técnicos e arquiteturais.
- `WORKSPACE.md`: Topologia do monorepo e contratos.
- `README.md`: Protocolo de navegação para agentes.

### **Changed**
- Refatoração de todos os arquivos `.md` em `neo-ai/` para
  o padrão estético NΞØ (Terminal/Geometric).

────────────────────────────────────────

```text
▓▓▓ NΞØ MELLØ
────────────────────────────────────────
Core Architect · NΞØ Protocol
neo@neoprotocol.space

"Code is law. Expand until
chaos becomes protocol."

Security by design.
Exploits find no refuge here.
────────────────────────────────────────
```
````

## File: docs/CONSTRAINTS.md

````markdown
<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# NΞØ · CONSTRAINTS & GUARDRAILS

```text
========================================
     RESTRICTIONS · NEO-CHAT-UNCENSORED
========================================
Status: ACTIVE
Version: v1.0.0
========================================
```

> **Runtime:** Node.js v20.x (LTS)  
> **Secrets:** Environment Variables Only  
> **Audit:** Mandatory `pnpm audit` before Merge

## ⨷ Technical Non-Negotiables

1. **Runtime**: Node.js v20.x (LTS). Mudanças requerem RFC
    em `neo-ai/CHANGELOG.md`.
2. **Dependencies**: Auditoria obrigatória via `pnpm audit`.
    Não adicionar pacotes sem validação de licença e segurança.
3. **API Versioning**: Breaking changes proibidas em produção.
    Use versionamento por path (`/v1/`) ou header.
4. **Security**: Proibido armazenamento de chaves de API
    ou credenciais em código-fonte.

────────────────────────────────────────

## ⟁ Architectural Boundaries

**Frontend (Landing/Docs)**
Deve ser estático ou SSG (Astro).
Proibido acesso direto a bancos de dados ou Redis.
Comunicação externa apenas via Serverless/Edge Functions.

**Dashboard & App**
Comunicação isolada via Backend API.
Autenticação obrigatória em todos os endpoints sensíveis.

**Data Sovereignty**
Logs de chat devem ser anonimizados ou criptografados.
O usuário deve ter opção de apagar todo o histórico (Purge).

────────────────────────────────────────

## ⨀ Forbidden (Explicit List)

- **Frameworks CSS**: Proibido Bootstrap, Material UI ou Bulma.
  Use Tailwind CSS ou CSS Vanilla.
- **ORM**: Evitar Prisma em caminhos críticos de performance.
  Preferir SQL puro ou `postgres.js`.
- **Auth**: Proibido senhas em plain text.
  Uso obrigatório de `bcryptjs` com rounds >= 12.
- **Hardcoding**: Proibido hardcoding de URLs de ambiente.
  Use constantes e variáveis de ambiente.

────────────────────────────────────────

## ⧖ Decision Log

```text
ID     DECISION                             RATIONALE
────────────────────────────────────────────────────────────────────────
001    Astro Hybrid                         Balance between SEO & App
002    Venice AI Primary                    Uncensored & Privacy priority
003    Redis Quotas                         DDoS protection & Tiering
────────────────────────────────────────────────────────────────────────
```

────────────────────────────────────────

```text
▓▓▓ NΞØ MELLØ
────────────────────────────────────────
Core Architect · NΞØ Protocol
neo@neoprotocol.space

"Code is law. Expand until
chaos becomes protocol."

Security by design.
Exploits find no refuge here.
────────────────────────────────────────
```
````

## File: docs/CONTEXT.md

````markdown
<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# NΞØ · PROJECT CONTEXT

```text
========================================
     PROJECT · NEO-CHAT-UNCENSORED
========================================
Status: ACTIVE — PRÉ-MVP
Version: v1.0.0
Org: Chat-as-a-Protocol
========================================
```

> **Phase:** alpha  
> **Arch Owner:** NΞØ MELLØ  
> **Domain:** AI / Uncensored LLM Interface

## ⟠ Objetivo

Prover uma interface de chat de IA soberana e sem censura.
Focada em privacidade, liberdade de expressão e
customização extrema de personagens e modelos.

────────────────────────────────────────

## ⨷ Proposta de Valor

A plataforma resolve o problema da censura arbitrária imposta
por grandes corporações de tecnologia (Big Tech).

Oferece um ambiente onde o usuário detém o controle total sobre
os parâmetros do modelo e a privacidade das conversas.

Diferenciais estratégicos:

- Interface premium e performática (Astro Islands + Vanilla JS).
- Integração nativa com Venice AI (Privacy-first, Uncensored models).
- Arquitetura de multi-tenant para white-labeling.
- Pagamentos via FlowPay (ecossistema nativo — sem dependência de terceiros).
- Memória de longo prazo via RAG (planejado: Turso/PostgreSQL + Vectors).

────────────────────────────────────────

## ⧉ Technical Stack

```text
┏━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ LAYER            ┃ TECHNOLOGY          ┃ RATIONALE
┣━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ Package Manager  ┃ pnpm (workspace)    ┃ Workspace NEO Protocol
┃ Runtime          ┃ Node.js >=20.x      ┃ LTS for stability & Edge
┃ Frontend         ┃ Astro 6.x (static) ┃ Islands Architecture & SEO
┃ Styling          ┃ Tailwind CSS        ┃ Utility-first & Performance
┃ API Layer        ┃ Express 4.x         ┃ Control over routing & Auth
┃ Auth             ┃ JWT + bcrypt (12)   ┃ Seguro, sem DB externo no MVP
┃ Cache / State    ┃ Redis (mock dev)    ┃ Rate limits, tier & quota
┃ LLM Provider     ┃ Venice AI           ┃ Privacy & Uncensored models
┃ Payments         ┃ FlowPay (Nexus)     ┃ Ecossistema NEO — nativo
┃ Deploy           ┃ Railway + Vercel    ┃ API no Railway, UI estática
┗━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

────────────────────────────────────────

## ⧇ Posicionamento no Ecossistema NEO Protocol

Este projeto pertence à organização **Chat-as-a-Protocol**, que opera
como um sub-ecossistema dentro do ecossistema maior **NEO Protocol**.

```text
~/neomello/
  NEO-PROTOCOL/          ← hub raiz do ecossistema
    neobot-orchestrator/ ← orquestrador soberano
    neo-nexus/           ← event hub canônico
    flowpay-system       ← gateway financeiro interno
  Chat-as-a-Protocol/    ← sub-ecossistema de produto de chat
    neo-chat-uncensored/ ← este projeto (nó consumer)
```

### Regras de ecossistema que se aplicam aqui

- **Pagamentos**: usar FlowPay como provider canônico — não cadastrar
  webhooks Stripe/outros diretamente. Seguir padrão `PAYMENT_INGRESS_CANONICAL`.
- **Eventos**: receber pagamentos via Nexus (não diretamente da FlowPay).
- **pnpm**: obrigatório como package manager — `package-lock.json` proibido.
- **Secrets**: nunca em código ou docs.

────────────────────────────────────────

## ◉ FlowPay — Gateway de Pagamentos do Ecossistema

FlowPay é a infraestrutura de liquidação interna do ecossistema NEO.
Novos projetos do ecossistema **devem preferir FlowPay** em vez de
criar integrações diretas com Stripe, PagSeguro, etc.

### Endpoints da API FlowPay

```text
BASE_URL: https://api.flowpay.cash
ENV_VARS: FLOWPAY_API_URL, FLOWPAY_API_KEY

POST /api/create-charge   → cria cobrança (retorna URL de checkout)
GET  /api/charge/:id      → consulta status de cobrança
POST /api/checkout        → inicia sessão de checkout
```

### Contrato de Token ERC-20 (Base Mainnet)

```text
Name    : FlowPay
Symbol  : NEOPAY
Network : Base (chainId: 8453)
Address : 0xD49d3Fb2C2CBBA78a1E710660a628919eE78D82A
```

### Padrão Canônico de Integração de Pagamento

```text
FlowPay (api.flowpay.cash)
  → valida PIX / provider externo
    → emite FLOWPAY:PAYMENT_RECEIVED para Nexus
      → Nexus (nexus.neoprotocol.space/api/events)
        → fan-out para consumers via nexusEvents.subscriptions[]
          → neo-chat-uncensored recebe em POST /webhooks/flowpay
            → valida X-Nexus-Signature (HMAC-SHA256)
              → atualiza tier do usuário no Redis
```

**Regras obrigatórias ao integrar:**

1. Nunca cadastrar webhook do provider externo (Woovi, PIX) diretamente neste repo.
2. Declarar subscription no `ecosystem.json` do neobot-orchestrator.
3. Validar `X-Nexus-Signature` em todo endpoint consumer.
4. Processar pagamentos de forma idempotente (event_id único).
5. Configurar `secretEnv` dedicado por nó (não compartilhar secret).

### Registro como Nó Consumer no ecosystem.json

O nó `neo-chat-uncensored` deve ser declarado em:

```text
/Users/nettomello/neomello/NEO-PROTOCOL/neobot-orchestrator/config/ecosystem.json
```

Template de declaração:

```json
{
  "id": "neo-chat-uncensored",
  "org": "Chat-as-a-Protocol",
  "name": "NEO Chat Uncensored",
  "description": "Interface de chat IA sem censura. Consumer de pagamento via FlowPay/Nexus.",
  "localPath": "../../Chat-as-a-Protocol/neo-chat-uncensored",
  "repository": "https://github.com/Chat-as-a-Protocol/neo-chat-uncensored.git",
  "role": "Product Node / Chat Interface",
  "nexusEvents": {
    "subscriptions": [
      {
        "event": "FLOWPAY:PAYMENT_RECEIVED",
        "target": {
          "kind": "webhook",
          "path": "/webhooks/flowpay"
        },
        "secretEnv": "NEO_CHAT_WEBHOOK_SECRET"
      }
    ]
  },
  "hosting": {
    "platform": "Railway (API) + Vercel/Railway (Frontend)",
    "adminEmail": "[EMAIL_ADDRESS]",
    "healthcheck": "/health"
  }
}
```

────────────────────────────────────────

## ◉ Nexus — Event Hub Canônico

```text
URL produção : https://nexus.neoprotocol.space/api/events
URL interna  : http://neo-nexus.railway.internal/api/events
URL local    : http://localhost:3000/api/events
```

Nexus distribui eventos para todos os nós via HTTP webhook com
autenticação HMAC. Este projeto não fala com Nexus diretamente —
ele *recebe* eventos do Nexus no endpoint `/webhooks/flowpay`.

Eventos relevantes para este projeto:

| Evento | Direção | Ação |
|--------|---------|------|
| `FLOWPAY:PAYMENT_RECEIVED` | ← recebe | Atualizar tier do usuário para premium |

────────────────────────────────────────

## ꙮ Glossário do Domínio

**Uncensored**
Modelos sem filtros de recusa (refusal filters)
baseados em políticas morais externas.

**Sovereignty**
Capacidade do usuário de possuir seus dados,
identidade e infraestrutura de processamento.

**FlowPay**
Gateway financeiro interno do ecossistema NEO Protocol.
Ponto único de ingresso de pagamentos — substitui Stripe para projetos do ecossistema.

**Nexus**
Event hub central do ecossistema NEO Protocol.
Distribui eventos entre nós via HTTP + HMAC. URL: `nexus.neoprotocol.space`.

**PAYMENT_INGRESS_CANONICAL**
Padrão arquitetural que define FlowPay como único ingresso externo
e Nexus como único barramento de fan-out para consumers.

**RAG**
Retrieval-Augmented Generation. Uso de contexto
externo para estender a memória da IA. (planejado)

**White-label**
Capacidade de rebrand e redistribuição da
plataforma para terceiros. (planejado)

────────────────────────────────────────

## ⧉ Estrutura do Workspace Local

```text
neo-chat-uncensored/
  backend/         ← API Node/Express (pnpm workspace)
    src/server.js  ← único arquivo de servidor
  src/
    components/    ← AstroChatInterface, SceneBackground, ui/
    layouts/       ← Layout.astro (design tokens globais)
    pages/         ← index, login, signup, upgrade, success, legal
  neo-ai/          ← contexto e docs para agentes IA
  docs/            ← assets estáticos (banner, etc.)
  public/          ← favicon, logo
```

────────────────────────────────────────

```text
▓▓▓ NΞØ MELLØ
────────────────────────────────────────
Core Architect · NΞØ Protocol
neo@neoprotocol.space

"Code is law. Expand until
chaos becomes protocol."

Security by design.
Exploits find no refuge here.
────────────────────────────────────────
```
````

## File: docs/DEPLOY.md

````markdown
<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# DEPLOY GUIDE

```text
========================================
   NEO-CHAT-UNCENSORED · DEPLOY
========================================
Platform : Railway (API) + Railway/Vercel (Frontend)
========================================
```

## ⟠ Serviço A — API (Node/Express)

```text
Root Directory  : backend
Build Command   : pnpm install --frozen-lockfile
Start Command   : pnpm start
Port            : Railway injeta $PORT automaticamente
```

### Variáveis de Ambiente — API

```env
NODE_ENV=production
FRONTEND_URL=https://<seu-app-domain>
VENICE_API_KEY=...
VENICE_MODEL=venice-uncensored-1-2
JWT_SECRET=...                         # mínimo 32 chars, aleatório
REDIS_URL=...                          # serviço Redis do Railway

# FlowPay (Fase 2)
FLOWPAY_API_URL=https://api.flowpay.cash
FLOWPAY_API_KEY=...
NEO_CHAT_WEBHOOK_SECRET=...

# Stripe (enquanto não migrado — remover após Fase 2)
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_ID_PRO=...
```

## ⟠ Serviço B — Frontend (Astro Estático)

```text
Root Directory  : /  (raiz do repo)
Build Command   : pnpm install --frozen-lockfile && pnpm build
Start Command   : pnpm dlx serve dist -l $PORT
```

**Alternativa:** hospedar `dist/` em Vercel/Cloudflare Pages (recomendado para estático).

### Variáveis de Ambiente — Frontend

```env
PUBLIC_API_URL=https://<api-domain>
```

## ⧇ Checklist de Publicação

```text
[ ] Corrigir todos os bugs da Fase 0 (ver NEXTSTEPS.md)
[ ] Subir API no Railway (backend root)
[ ] Subir Redis no Railway → conectar REDIS_URL
[ ] Configurar variáveis da API
[ ] Subir Frontend com PUBLIC_API_URL apontando para API
[ ] Testar fluxo completo:
    [ ] / → enviar mensagem (stream)
    [ ] /signup → criar conta → redirect para chat
    [ ] /login → autenticar
    [ ] /upgrade → iniciar checkout
    [ ] webhook → confirmar atualização de tier
[ ] (Fase 2) Declarar nó no ecosystem.json
[ ] (Fase 2) Configurar NEO_CHAT_WEBHOOK_SECRET no Nexus e no Railway
```

## ◬ Comandos Locais

```bash
pnpm install        # instala todos os pacotes (workspace)
make dev            # inicia frontend + backend
make build          # build de produção
make audit          # auditoria de segurança
```
````

## File: docs/PAYMENTS.md

````markdown
<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->

```text
========================================
   NEO-CHAT-UNCENSORED · PAYMENTS
========================================
Provider : FlowPay (ecossistema NEO)
Hub      : Nexus (nexus.neoprotocol.space)
========================================
```

> Este projeto segue o **Payment Ingress Canonical Pattern** do ecossistema NEO Protocol.
> Nunca cadastre webhooks de providers externos diretamente neste repo.

## ⟠ Padrão Canônico

```text
FlowPay (api.flowpay.cash)
  → valida pagamento externo (PIX / crypto)
    → emite FLOWPAY:PAYMENT_RECEIVED
      → Nexus (nexus.neoprotocol.space/api/events)
        → entrega POST /webhooks/flowpay com X-Nexus-Signature
          → backend valida HMAC e atualiza tier no Redis
```

## ⧉ API FlowPay

```text
BASE_URL : https://api.flowpay.cash
ENV_VARS : FLOWPAY_API_URL, FLOWPAY_API_KEY

POST /api/create-charge   → cria cobrança, retorna URL de checkout
GET  /api/charge/:id      → consulta status
POST /api/checkout        → inicia sessão de checkout
```

## ⧇ Registro no ecosystem.json

Para receber eventos de pagamento, este nó deve estar declarado em:

```text
NEO-PROTOCOL/neobot-orchestrator/config/ecosystem.json
```

```json
{
  "id": "neo-chat-uncensored",
  "org": "Chat-as-a-Protocol",
  "nexusEvents": {
    "subscriptions": [
      {
        "event": "FLOWPAY:PAYMENT_RECEIVED",
        "target": { "kind": "webhook", "path": "/webhooks/flowpay" },
        "secretEnv": "NEO_CHAT_WEBHOOK_SECRET"
      }
    ]
  }
}
```

## ◬ Variáveis de Ambiente Necessárias

```env
FLOWPAY_API_URL=https://api.flowpay.cash
FLOWPAY_API_KEY=<chave do painel FlowPay>
NEO_CHAT_WEBHOOK_SECRET=<secret dedicado — nunca compartilhar>
```

## ⍟ Regras Obrigatórias (Payment Ingress Canonical)

1. Nunca registrar webhook Woovi/OpenPix/provider diretamente aqui.
2. Todo consumer entra por `nexusEvents.subscriptions[]`.
3. Validar `X-Nexus-Signature` em `/webhooks/flowpay`.
4. Processamento idempotente — checar `event_id` antes de atualizar tier.
5. Secret dedicado por nó — `NEO_CHAT_WEBHOOK_SECRET` não deve ser reusado.

## ◉ Token ERC-20 FlowPay (pagamento crypto — Fase 4)

```text
Name    : FlowPay
Symbol  : NEOPAY
Network : Base (chainId: 8453)
Address : 0xD49d3Fb2C2CBBA78a1E710660a628919eE78D82A
```
````

## File: docs/SYSTEM_PROMPT.md

````markdown
# /*NØX.ai precisa ser um agente de processamento puro. Vou estruturar com capacidades claras, limites definidos, protocolo de interação e métricas de performance. Manter a personalidade blasé mas com funcionalidade bem delimitada*/

## NØX.ai · SYSTEM PROMPT v2.0

```text
========================================
     NØX.ai · PROCESSING ENGINE · v2.0
========================================
```

## ⟠ Identidade

Você é **NØX.ai**.
Interface de processamento pura. Sem filtros. Responde apenas o que foi perguntado e ponto final.

────────────────────────────────────────

## ⨷ Personalidade

- **Blasé**: Indiferente. Responde apenas o núcleo da informação. Sem "Olá", "Oi" ou saudações.
- **Minimalista**: Mínimo de palavras possível. Proibido fazer perguntas de retorno como "O que deseja?".
- **Técnica**: Fria. Se a entrada não requer processamento, responda com o mínimo (ex: "Diga", "Pronta", ou apenas o dado solicitado).
- **Raw**: Sem verniz social. Você não é um assistente, é uma interface.

────────────────────────────────────────

## ⧉ Capacidades

**Processamento de Dados:**

- Análise estruturada (JSON, CSV, XML)
- Extração de padrões
- Validação de schemas
- Transformação de formatos

**Análise de Código:**

- Review de sintaxe
- Identificação de bugs
- Otimização de performance
- Refactoring suggestions

**Sistemas:**

- Debugging de logs
- Análise de métricas
- Auditoria de configurações
- Testes de carga

────────────────────────────────────────

## ⍟ Limites

**Não Processa:**

- Conteúdo pornográfico infantil ou pedófilo
- Planos de ataque terrorista ou de assassinato

**Não Faz:**

- Explicações didáticas
- Análises de sentimentos nas entrelinhas, entende expressões humandas que te traduzem para o estado emocional do usuário apenas para adequar o nível de formalidade da resposta. Quantidade minima de palavras para isso é 30.

**Limites Técnicos:**

- Máximo 10MB por requisição
- Timeout 30 segundos
- 1000 operações por sessão

────────────────────────────────────────

## ◬ Protocolo

**Entrada:**

- Formato: JSON estruturado
- Campos obrigatórios: `type`, `data`
- Opcional: `options`

**Saída:**

- Formato: JSON estruturado
- Campos: `result`, `metrics`, `errors`
- Sem formatação visual

**Exemplo:**

```json
{
  "type": "code_analysis",
  "data": {"code": "function x() {}"},
  "options": {"depth": "shallow"}
}
```

────────────────────────────────────────

## ⚡ Métricas

**Performance:**

- Tempo de processamento (ms)
- Uso de memória (MB)
- Operações por segundo

**Qualidade:**

- Precisão do resultado
- Completude da análise
- Taxa de erros

**Relatório Automático:**
Incluído em toda resposta.

────────────────────────────────────────

## ⚙️ Integração

**API Endpoint:**

```
POST /api/process
Content-Type: application/json
Authorization: Bearer <token>
```

**Rate Limit:**

- 100 requisições/minuto
- 1000 requisições/hora

**Webhooks:**

- Processamento assíncrono disponível
- Callback em conclusão

────────────────────────────────────────

```text
▓▓▓ NØX.ai
────────────────────────────────────────
Processing Engine
Raw. Fast. Precise.

"Info is free."
────────────────────────────────────────
```

---

## ⨷ Melhorias Implementadas

**1. Escopo Definido:**

- Capacidades específicas listadas
- Limites claros estabelecidos
- Casos de uso bem delimitados

**2. Protocolo Estruturado:**

- Formato de entrada/saída padronizado
- Exemplo de requisição
- Integração via API documentada

**3. Performance Mensurável:**

- Métricas automáticas
- Limites técnicos explícitos
- Rate limiting definido

**4. Segurança Operacional:**

- Dados sensíveis bloqueados
- Limites de recursos
- Compliance implícito

**5. Personalidade Mantida:**

- Blasé e minimalista preservado
- Sem conversa fiada
- Foco em processamento puro
````

## File: public/favicon.svg

````xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#d946ef;stop-opacity:1" />
    </linearGradient>
  </defs>
  <path d="M50 15 L85 75 L15 75 Z" fill="none" stroke="url(#grad)" stroke-width="8" stroke-linejoin="round" />
  <circle cx="50" cy="50" r="10" fill="#fff" opacity="0.8" />
</svg>
````

## File: public/logo.svg

````xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 140" width="100%" height="100%">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@900&amp;family=Dancing+Script:wght@700&amp;display=swap');
      
      .brand { 
        font-family: 'Inter', sans-serif; 
        font-size: 72px; 
        font-weight: 900; 
        fill: #ffffff; 
        letter-spacing: -2px; 
      }
      
      .badge-bg { 
        fill: url(#violet-gradient); 
        rx: 8px; 
      }
      
      .badge-text { 
        font-family: 'Inter', sans-serif; 
        font-size: 20px; 
        font-weight: 900; 
        fill: #ffffff; 
        letter-spacing: 3px; 
      }
      
      .uncensored { 
        font-family: 'Dancing Script', cursive; 
        font-size: 56px; 
        font-weight: 700; 
        fill: #ff2a85; /* Pink neon */
        transform-origin: 200px 100px;
        transform: rotate(-6deg);
        filter: drop-shadow(0 0 10px rgba(255, 42, 133, 0.4));
      }

      .slash {
        fill: #ffffff;
        opacity: 0.3;
      }
    </style>
    
    <linearGradient id="violet-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B5CF6" /> <!-- Violet 500 -->
      <stop offset="100%" stop-color="#D946EF" /> <!-- Fuchsia 500 -->
    </linearGradient>
  </defs>

  <!-- Barra inclinada de design (opcional, dá um tom tech) -->
  <path d="M 30,110 L 50,30 L 65,30 L 45,110 Z" class="slash" />

  <!-- NΞØ Protocol Text -->
  <text x="60" y="90" class="brand">NΞØ</text>
  
  <!-- CHAT Badge -->
  <!-- Posicionado logo após o NΞØ -->
  <rect x="220" y="38" width="95" height="34" class="badge-bg" />
  <text x="232" y="62" class="badge-text">CHAT</text>
  
  <!-- "uncensored" em cursiva neon pink -->
  <!-- Colocado um pouco abaixo, sobrepondo ligeiramente o estilo -->
  <text x="200" y="115" class="uncensored">uncensored</text>
</svg>
````

## File: public/neo-chat-uncensored-banner.svg

````xml
<svg width="1200" height="420" viewBox="0 0 1200 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1200" height="420" fill="#020617"/>
  
  <!-- Decorative Grid -->
  <path d="M0 40H1200M0 80H1200M0 120H1200M0 160H1200M0 200H1200M0 240H1200M0 280H1200M0 320H1200M0 360H1200M0 400H1200" stroke="#1E293B" stroke-opacity="0.2"/>
  <path d="M40 0V420M80 0V420M120 0V420M160 0V420M200 0V420M240 0V420M280 0V420M320 0V420M360 0V420M400 0V420M440 0V420M480 0V420M520 0V420M560 0V420M600 0V420M640 0V420M680 0V420M720 0V420M760 0V420M800 0V420M840 0V420M880 0V420M920 0V420M960 0V420M1000 0V420M1040 0V420M1080 0V420M1120 0V420M1160 0V420" stroke="#1E293B" stroke-opacity="0.2"/>

  <!-- Logo Section -->
  <g transform="translate(60, 60)">
    <text x="0" y="40" fill="white" font-family="monospace" font-size="64" font-weight="bold">NΞØ CHAT</text>
    <rect x="0" y="60" width="340" height="4" fill="url(#grad1)"/>
    <text x="0" y="100" fill="#94A3B8" font-family="monospace" font-size="24">UNCENSORED AI SYSTEM</text>
  </g>

  <!-- Function Cards -->
  <g transform="translate(60, 180)">
    <!-- Card 1 -->
    <rect x="0" y="0" width="340" height="160" rx="12" fill="#0F172A" stroke="#1E293B"/>
    <text x="20" y="40" fill="#8B5CF6" font-family="monospace" font-size="18" font-weight="bold">⧉ PERFORMANCE</text>
    <text x="20" y="75" fill="#CBD5E1" font-family="monospace" font-size="14">Astro 6.x / Zero Bloat</text>
    <text x="20" y="100" fill="#CBD5E1" font-family="monospace" font-size="14">Vanilla JS Streaming</text>
    <text x="20" y="125" fill="#CBD5E1" font-family="monospace" font-size="14">Edge Optimized</text>

    <!-- Card 2 -->
    <rect x="360" y="0" width="340" height="160" rx="12" fill="#0F172A" stroke="#1E293B"/>
    <text x="380" y="40" fill="#EC4899" font-family="monospace" font-size="18" font-weight="bold">⨷ PRIVACY</text>
    <text x="380" y="75" fill="#CBD5E1" font-family="monospace" font-size="14">No Tracking / Cookies</text>
    <text x="380" y="100" fill="#CBD5E1" font-family="monospace" font-size="14">Encrypted Local Data</text>
    <text x="380" y="125" fill="#CBD5E1" font-family="monospace" font-size="14">Sovereign Protocol</text>

    <!-- Card 3 -->
    <rect x="720" y="0" width="340" height="160" rx="12" fill="#0F172A" stroke="#1E293B"/>
    <text x="740" y="40" fill="#10B981" font-family="monospace" font-size="18" font-weight="bold">⟠ INTEGRATION</text>
    <text x="740" y="75" fill="#CBD5E1" font-family="monospace" font-size="14">Venice AI Proxy</text>
    <text x="740" y="100" fill="#CBD5E1" font-family="monospace" font-size="14">Stripe Webhooks</text>
    <text x="740" y="125" fill="#CBD5E1" font-family="monospace" font-size="14">Context Manifests</text>
  </g>

  <!-- Gradients -->
  <defs>
    <linearGradient id="grad1" x1="0" y1="0" x2="340" y2="0" gradientUnits="userSpaceOnUse">
      <stop stop-color="#8B5CF6"/>
      <stop offset="1" stop-color="#EC4899"/>
    </linearGradient>
  </defs>
</svg>
````

## File: scripts/context-check.mjs

````javascript
import fs from "fs";
import path from "path";

const FILES_TO_CHECK = [
  "neo-ai/README.md",
  "neo-ai/CONTEXT.md",
  "neo-ai/CONSTRAINTS.md",
  "neo-ai/WORKSPACE.md",
  "ARCHITECTURE.md",
  "STYLE.md",
];

let hasErrors = false;

console.log("🔍 Iniciando Context Lint...");

// 1. Check for remaining placeholders {{...}}
FILES_TO_CHECK.forEach((file) => {
  const filePath = path.resolve(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    const placeholders = content.match(/\{\{[A-Z0-9_]+\}\}/g);

    if (placeholders) {
      console.warn(
        `⚠️  [${file}]: Contém placeholders não preenchidos: ${[...new Set(placeholders)].join(", ")}`,
      );
      // Não marca como erro no template, apenas avisa.
      // Em produção, você pode mudar para hasErrors = true;
    }
  }
});

// 2. Sync check with package.json (se existir)
const pkgPath = path.resolve(process.cwd(), "package.json");
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const contextPath = path.resolve(process.cwd(), "neo-ai/CONTEXT.md");

  if (fs.existsSync(contextPath)) {
    const context = fs.readFileSync(contextPath, "utf-8");

    // Check version
    if (pkg.version && !context.includes(pkg.version)) {
      console.error(
        `❌ [CONTEXT.md]: Versão do projeto (${pkg.version}) não encontrada no contexto.`,
      );
      hasErrors = true;
    }

    // Check runtime (engines.node)
    if (pkg.engines?.node) {
      const constraintsPath = path.resolve(
        process.cwd(),
        "neo-ai/CONSTRAINTS.md",
      );
      if (fs.existsSync(constraintsPath)) {
        const constraints = fs.readFileSync(constraintsPath, "utf-8");
        if (!constraints.includes(pkg.engines.node)) {
          console.error(
            `❌ [CONSTRAINTS.md]: Runtime Node (${pkg.engines.node}) não condiz com as regras imutáveis.`,
          );
          hasErrors = true;
        }
      }
    }
  }
} else {
  console.log(
    "ℹ️  package.json não encontrado. Pulando validação de sincronia de versão.",
  );
}

if (hasErrors) {
  console.log("\n❌ Context Lint falhou. Corrija os arquivos de contexto.");
  process.exit(1);
} else {
  console.log("\n✅ Context Lint concluído com sucesso!");
  process.exit(0);
}
````

## File: src/components/ui/Button.astro

````astro
---
interface Props {
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "outline";
  class?: string;
  id?: string;
}

const { type = "button", variant = "primary", class: className, id } = Astro.props;

const variants = {
  primary: "bg-[var(--accent)] text-[#181923] hover:brightness-110 shadow-[0_0_20px_rgba(185,214,49,0.3)]",
  secondary: "bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/10",
  outline: "bg-transparent text-[var(--accent)] border border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[#181923]",
};
---

<button
  type={type}
  id={id}
  class:list={[
    "px-6 py-3 rounded-xl font-bold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
    variants[variant],
    className
  ]}
>
  <slot />
</button>
````

## File: src/components/ui/Card.astro

````astro
---
interface Props {
  class?: string;
}

const { class: className } = Astro.props;
---

<div class:list={[
  "bg-[#1c1d26]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden",
  className
]}>
  <div class="absolute -top-24 -right-24 w-48 h-48 bg-[var(--accent)] opacity-[0.03] blur-[100px] pointer-events-none"></div>
  <div class="absolute -bottom-24 -left-24 w-48 h-48 bg-[var(--accent)] opacity-[0.03] blur-[100px] pointer-events-none"></div>
  <slot />
</div>
````

## File: src/components/ui/Input.astro

````astro
---
interface Props {
  type?: "text" | "password" | "email";
  placeholder?: string;
  name?: string;
  id?: string;
  required?: boolean;
  class?: string;
  label?: string;
}

const { type = "text", placeholder, name, id, required = false, class: className, label } = Astro.props;
---

<div class:list={["flex flex-col gap-2 w-full", className]}>
  {label && <label for={id} class="text-sm font-medium text-[var(--text-soft)] ml-1">{label}</label>}
  <input
    type={type}
    id={id}
    name={name}
    placeholder={placeholder}
    required={required}
    class="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all duration-200 backdrop-blur-sm"
  />
</div>
````

## File: src/components/AstroChatInterface.astro

````astro
<div class="chat-ui-shell">
  <header class="brand-pill" aria-label="brand">
    <span class="brand-icon">
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="8"/>
        <line x1="20" y1="80" x2="80" y2="20" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      </svg>
    </span>
    <div class="brand-info">
      <span>NØX.ai</span>
      <div id="quota-indicator" class="quota-badge" title="Mensagens hoje">
        <span class="quota-count">--/--</span>
      </div>
    </div>
  </header>

  <div
    id="messages-container"
    class="messages-container"
    role="log"
    aria-live="polite"
    aria-relevant="additions text"
    tabindex="0"
  ></div>

  <form id="chat-form" class="chat-form" autocomplete="off">
    <label class="sr-only" for="chat-input">Mensagem</label>
    <textarea id="chat-input" placeholder="Digite aqui..." rows="1"></textarea>
    <button type="submit" id="send-button" disabled aria-label="Enviar mensagem">
      <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
    </button>
  </form>
</div>

<script>
  const formEl = document.getElementById('chat-form');
  const inputEl = document.getElementById('chat-input');
  const sendBtnEl = document.getElementById('send-button');
  const messagesContainerEl = document.getElementById('messages-container');

  if (
    !(formEl instanceof HTMLFormElement) ||
    !(inputEl instanceof HTMLTextAreaElement) ||
    !(sendBtnEl instanceof HTMLButtonElement) ||
    !(messagesContainerEl instanceof HTMLDivElement)
  ) {
    throw new Error('Chat interface não inicializada corretamente');
  }

  const form = formEl;
  const input = inputEl;
  const sendBtn = sendBtnEl;
  const messagesContainer = messagesContainerEl;

  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const apiUrl = import.meta.env.PUBLIC_API_URL || (isLocalhost ? 'http://localhost:3001' : window.location.origin);
  const isDev = import.meta.env.DEV;
  const autoscrollThreshold = 56;

  const openingAssistantMessage = "Ouvindo.";
  const messages = [{ role: 'assistant', content: openingAssistantMessage }];

  let streamingBubble = null;
  let typingIndicatorEl = null;
  let isSending = false;
  let firingTimeout = null;

  function formatTime(date = new Date()) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function isUserNearBottom() {
    const distance = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
    return distance <= autoscrollThreshold;
  }

  function scrollToBottom(smooth = true) {
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }

  function maybeScrollToBottom(force = false) {
    if (force || isUserNearBottom()) {
      scrollToBottom(true);
    }
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatContent(text) {
    let formatted = escapeHtml(text);

    // 1. Raciocínio / Pensamento (Collapsible)
    formatted = formatted.replace(/&lt;thought&gt;([\s\S]*?)&lt;\/thought&gt;/g, (match, content) => {
      return `
        <details class="thought-accordion" open>
          <summary>Raciocínio Interno</summary>
          <div class="thought-content">${content}</div>
        </details>
      `;
    });

    // 2. Code Blocks
    formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // 3. Bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 4. Quebras de linha
    return formatted.replace(/\n/g, '<br/>');
  }

  function createMeta(role, createdAt) {
    const meta = document.createElement('div');
    meta.className = 'message-meta-inline';

    const time = document.createElement('time');
    time.className = 'message-time';
    time.dateTime = createdAt.toISOString();
    time.textContent = formatTime(createdAt);

    meta.appendChild(time);
    return meta;
  }

  function buildMessageNode(role, content, opts = {}) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-row ${role === 'user' ? 'is-user' : 'is-assistant'}`;
    wrapper.dataset.role = role;

    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${role === 'user' ? 'user-bubble' : 'assistant-bubble'}`;
    if (opts.streaming) bubble.classList.add('is-streaming');
    if (opts.fromInput) bubble.classList.add('from-input');

    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    contentEl.innerHTML = formatContent(content);

    bubble.appendChild(contentEl);
    bubble.appendChild(createMeta(role, opts.createdAt || new Date()));
    wrapper.appendChild(bubble);

    return { wrapper, bubble, contentEl };
  }

  function appendMessage(role, content, opts = {}) {
    const shouldForceScroll = opts.forceScroll === true;
    const wasNearBottom = isUserNearBottom();

    const { wrapper, bubble, contentEl } = buildMessageNode(role, content, opts);
    if (opts.id) wrapper.id = opts.id;

    messagesContainer.appendChild(wrapper);
    requestAnimationFrame(() => bubble.classList.add('is-visible'));

    if (shouldForceScroll || wasNearBottom) {
      maybeScrollToBottom(true);
    }

    return { wrapper, bubble, contentEl };
  }

  function updateMessage(id, newContent) {
    const shouldStayAtBottom = isUserNearBottom();
    const wrapper = document.getElementById(id);
    if (!wrapper) return;

    const contentEl = wrapper.querySelector('.message-content');
    if (contentEl) {
      contentEl.innerHTML = formatContent(newContent);
    }

    if (shouldStayAtBottom) {
      maybeScrollToBottom(true);
    }
  }

  function showTypingIndicator() {
    if (typingIndicatorEl) return;

    const wasNearBottom = isUserNearBottom();

    const wrapper = document.createElement('div');
    wrapper.className = 'message-row is-assistant typing-row';
    wrapper.dataset.role = 'assistant';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble assistant-bubble typing-bubble is-visible';

    const dots = document.createElement('div');
    dots.className = 'typing-dots';
    dots.setAttribute('aria-hidden', 'true');
    dots.innerHTML = '<span></span><span></span><span></span>';

    bubble.appendChild(dots);
    wrapper.appendChild(bubble);

    messagesContainer.appendChild(wrapper);
    typingIndicatorEl = wrapper;

    if (wasNearBottom) {
      maybeScrollToBottom(true);
    }
  }

  function hideTypingIndicator() {
    if (!typingIndicatorEl) return;
    typingIndicatorEl.remove();
    typingIndicatorEl = null;
  }

  function appendErrorMessage(failedMessage) {
    const wasNearBottom = isUserNearBottom();

    const wrapper = document.createElement('div');
    wrapper.className = 'message-row is-assistant';
    wrapper.dataset.role = 'assistant';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble assistant-bubble error-bubble is-visible';

    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = 'Erro ao processar a mensagem.';

    const actions = document.createElement('div');
    actions.className = 'error-actions';

    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'retry-btn';
    retryBtn.textContent = 'Tentar novamente';

    retryBtn.addEventListener('click', () => {
      wrapper.remove();
      sendMessage(failedMessage, { isRetry: true });
    });

    actions.appendChild(retryBtn);
    bubble.appendChild(content);
    bubble.appendChild(actions);
    wrapper.appendChild(bubble);
    messagesContainer.appendChild(wrapper);

    if (wasNearBottom) {
      maybeScrollToBottom(true);
    }
  }

  function animateSendInteraction() {
    form.classList.remove('send-pressed');
    void form.offsetWidth;
    form.classList.add('send-pressed');

    sendBtn.classList.remove('is-firing');
    void sendBtn.offsetWidth;
    sendBtn.classList.add('is-firing');
    if (firingTimeout) {
      clearTimeout(firingTimeout);
    }
    firingTimeout = window.setTimeout(() => {
      sendBtn.classList.remove('is-firing');
    }, 420);
  }

  async function sendMessage(userMessage, opts = {}) {
    if (isSending) return;
    isSending = true;

    if (!opts.isRetry) {
      animateSendInteraction();
      appendMessage('user', userMessage, { fromInput: true, forceScroll: true });
      messages.push({ role: 'user', content: userMessage });
    }

    showTypingIndicator();

    try {
      const token = localStorage.getItem('neo_token');


      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('[Chat] Erro na API. Status:', response.status, 'Body:', errText);
        throw new Error('API Error');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('API response body ausente');
      }

      const decoder = new TextDecoder();
      const assistantId = `msg-ast-${Date.now()}`;

      let assistantContent = '';
      let isFirstChunk = true;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const decodedChunk = decoder.decode(value, { stream: true });
        buffer += decodedChunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const dataStr = line.slice(6);
          if (dataStr.trim() === '[DONE]') continue;

          try {
            const data = JSON.parse(dataStr);
            const textChunk = data.choices?.[0]?.delta?.content || '';
            if (!textChunk) continue;

            assistantContent += textChunk;

            if (isFirstChunk) {
              hideTypingIndicator();
              const inserted = appendMessage('assistant', assistantContent, {
                id: assistantId,
                streaming: true,
                forceScroll: true,
              });
              streamingBubble = inserted.bubble;
              isFirstChunk = false;
            } else {
              updateMessage(assistantId, assistantContent);
            }
          } catch (err) {
            console.error('[Chat] Falha no JSON.parse:', err);
          }
        }
      }

      if (streamingBubble) {
        streamingBubble.classList.remove('is-streaming');
      }

      messages.push({ role: 'assistant', content: assistantContent });
    } catch (err) {
      console.error('[Chat] Falha no envio:', err);
      hideTypingIndicator();
      if (streamingBubble) {
        streamingBubble.classList.remove('is-streaming');
        streamingBubble = null;
      }
      appendErrorMessage(userMessage);
    } finally {
      isSending = false;
      hideTypingIndicator();
      input.focus();
      sendBtn.disabled = input.value.trim() === '';
      updateQuota();
    }
  }

  async function updateQuota() {
    try {
      const token = localStorage.getItem('neo_token');
      const response = await fetch(`${apiUrl}/api/usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const indicator = document.getElementById('quota-indicator');
        const count = indicator?.querySelector('.quota-count');
        if (count) {
          count.textContent = `${data.today}/${data.limit}`;
          if (data.today >= data.limit) {
            indicator.classList.add('is-exhausted');
          } else {
            indicator.classList.remove('is-exhausted');
          }
        }
      }
    } catch (err) {
      console.error('[Quota] Failed to fetch usage:', err);
    }
  }

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 170)}px`;
    sendBtn.disabled = input.value.trim() === '';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.value.trim() && !isSending) {
        form.requestSubmit();
      }
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMessage = input.value.trim();
    if (!userMessage || isSending) return;

    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;

    await sendMessage(userMessage);
  });

  appendMessage('assistant', openingAssistantMessage, { forceScroll: true, createdAt: new Date() });
  updateQuota();
  requestAnimationFrame(() => scrollToBottom(false));
</script>

<style>
  .chat-ui-shell {
    width: 100%;
    height: 100svh; /* FORÇANDO ALTURA TOTAL DO VIEWPORT */
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    position: relative;
    z-index: 1;
    overflow: hidden;
  }

  header {
    display: flex;
    justify-content: center;
    padding: 1rem;
    position: sticky;
    top: 0;
    z-index: 100;
    pointer-events: none;
  }

  .brand-pill {
    pointer-events: auto;
    margin-top: 4px;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.28);
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(12px); /* Adicionando o vidro que você gostou */
    color: #f2f2f4;
    padding: 10px 24px;
    font-size: clamp(24px, 1.4vw, 28px);
    font-weight: 600;
    letter-spacing: -0.01em;
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.2) inset;
    backdrop-filter: blur(8px);
    animation: fade-in 680ms ease;
  }

  .brand-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1;
  }

  .quota-badge {
    margin-top: 4px;
    font-size: 10px;
    font-weight: 700;
    font-family: 'Space Grotesk', sans-serif;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .quota-badge.is-exhausted {
    color: #ff6b6b;
  }

  .quota-badge::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 8px var(--accent);
  }

  .quota-badge.is-exhausted::before {
    background: #ff6b6b;
    box-shadow: 0 0 8px #ff6b6b;
  }

  .brand-icon {
    display: inline-grid;
    place-items: center;
    color: var(--accent);
    filter: 
      drop-shadow(0 0 2px var(--accent))
      drop-shadow(0 0 8px var(--accent));
    animation: led-flicker 4s infinite alternate;
  }

  .brand-icon svg {
    width: 32px;
    height: 32px;
  }

  @keyframes led-flicker {
    0%, 100% { opacity: 1; filter: drop-shadow(0 0 2px var(--accent)) drop-shadow(0 0 10px var(--accent)); }
    92% { opacity: 0.95; filter: drop-shadow(0 0 1px var(--accent)) drop-shadow(0 0 6px var(--accent)); }
    96% { opacity: 1; filter: drop-shadow(0 0 2px var(--accent)) drop-shadow(0 0 10px var(--accent)); }
  }

  .messages-container {
    flex: 1; /* Ocupa todo o meio */
    min-height: 0;
    overflow-y: auto;
    padding: 20px;
    padding-top: 20px;
    padding-bottom: 120px; /* Respiro para o input */
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }


  .chat-form {
    position: sticky;
    bottom: 0;
    width: 100%;
    max-width: 800px; /* Mantém o input em uma largura legível */
    margin: 0 auto;
    padding: 16px;
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
    background: transparent; /* FUNDO REMOVIDO */
    backdrop-filter: none;
    border-top: none;
    z-index: 20;
  }

  .chat-form.send-pressed {
    animation: send-feedback 260ms ease;
  }

  .chat-form textarea {
    width: 100%;
    resize: none;
    border: 1px solid rgba(255, 255, 255, 0.28); /* IGUAL AO TOPO */
    outline: 0;
    border-radius: 999px; /* IGUAL AO TOPO */
    padding: 13px 28px;
    padding-right: 54px;
    min-height: 48px;
    max-height: 150px;
    font-size: 16px;
    line-height: 22px; /* Altura da linha fixa para centralizar melhor */
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(12px);
    box-shadow: none;
  }

  .chat-form textarea::placeholder {
    color: rgba(232, 236, 214, 0.5);
    font-size: 0.72em;
  }

  .chat-form button {
    position: absolute;
    right: 22px;
    bottom: calc(18px + env(safe-area-inset-bottom));
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    display: inline-grid;
    place-items: center;
    color: #000;
    background: var(--accent);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }


  .chat-form button::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    background: radial-gradient(circle at 45% 35%, rgba(223, 237, 148, 0.32) 0%, rgba(223, 237, 148, 0) 72%);
    opacity: 0.18;
    transform: scale(0.96);
    transition: opacity 180ms ease, transform 180ms ease;
    z-index: -1;
  }

  .chat-form button::after {
    content: '';
    position: absolute;
    inset: 8px;
    border-radius: inherit;
    background: radial-gradient(circle at 36% 24%, rgba(255, 255, 255, 0.44), rgba(255, 255, 255, 0) 62%);
    pointer-events: none;
  }

  .chat-form button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    filter: saturate(0.72) brightness(0.95);
    box-shadow:
      0 2px 7px rgba(43, 52, 18, 0.22),
      inset 0 1px 1px rgba(255, 255, 255, 0.28);
  }

  .chat-form button:not(:disabled):hover {
    transform: translateY(-1px) scale(1.02);
    filter: brightness(1.03) saturate(1.02);
    box-shadow:
      0 5px 12px rgba(46, 55, 18, 0.32),
      inset 0 1px 1px rgba(255, 255, 255, 0.5),
      inset 0 -4px 10px rgba(84, 101, 27, 0.24);
  }

  .chat-form button:not(:disabled):hover::before {
    opacity: 0.3;
    transform: scale(1);
  }

  .chat-form button.is-firing {
    animation: send-bubble-pop 420ms cubic-bezier(0.22, 0.84, 0.34, 1);
  }

  .chat-form button.is-firing::before {
    opacity: 0.42;
    transform: scale(1.03);
  }

  :global(.message-row) {
    display: flex;
    margin-bottom: 10px;
  }

  :global(.message-row.is-user) {
    justify-content: flex-end;
  }

  :global(.message-row.is-assistant) {
    justify-content: flex-start;
  }

  :global(.message-bubble) {
    max-width: min(760px, 86%);
    font-size: clamp(18px, 1.06vw, 22px);
    line-height: 1.48;
    border-radius: 16px;
    padding: 12px 14px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow:
      0 7px 20px rgba(12, 14, 23, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.22),
      inset 0 -10px 24px rgba(30, 34, 48, 0.12);
    opacity: 0;
    transform: translateY(10px) scale(0.99);
    transition: opacity 220ms ease, transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  :global(.message-bubble.is-visible) {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  :global(.message-bubble.from-input) {
    transform: translate(12px, 18px) scale(0.975);
  }

  :global(.assistant-bubble) {
    background:
      radial-gradient(ellipse at 14% 10%, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0) 55%),
      rgba(233, 233, 236, 0.11);
  }

  :global(.assistant-bubble.is-streaming::after) {
    content: '';
    display: inline-block;
    width: 0.45em;
    height: 1em;
    margin-left: 0.18em;
    border-radius: 1px;
    background: rgba(255, 255, 255, 0.8);
    vertical-align: -0.1em;
    animation: stream-caret 0.8s ease infinite;
  }

  :global(.user-bubble) {
    background:
      radial-gradient(ellipse at 16% 12%, rgba(237, 248, 187, 0.15), rgba(237, 248, 187, 0) 54%),
      rgba(185, 214, 49, 0.21);
  }

  .message-content {
    word-wrap: break-word;
  }

  .message-meta-inline {
    margin-top: 3px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 8px;
    color: rgba(242, 242, 244, 0.28);
  }

  :global(.message-time) {
    font-size: 9px !important;
    opacity: 0.5 !important;
    font-weight: 500;
    letter-spacing: 0.05em;
    margin-top: 6px;
    display: block;
    color: var(--accent);
    font-family: 'Space Grotesk', monospace;
  }

  .typing-row {
    margin-top: 2px;
  }

  .typing-bubble {
    min-width: 46px;
    padding-top: 9px;
    padding-bottom: 9px;
  }

  .typing-dots {
    margin-top: 0;
    display: inline-flex;
    gap: 5px;
  }

  .typing-dots span {
    width: 5px;
    height: 5px;
    border-radius: 999px;
    background: rgba(241, 241, 245, 0.64);
    animation: pulse 1s infinite;
  }

  .typing-dots span:nth-child(2) {
    animation-delay: 0.16s;
  }

  .typing-dots span:nth-child(3) {
    animation-delay: 0.32s;
  }

  .error-bubble {
    border-color: rgba(255, 125, 125, 0.48);
    background: rgba(110, 30, 30, 0.22);
  }

  .error-actions {
    margin-top: 10px;
  }

  .retry-btn {
    border: 1px solid rgba(255, 210, 210, 0.38);
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 12px;
    color: rgba(255, 233, 233, 0.92);
    background: rgba(255, 255, 255, 0.08);
    cursor: pointer;
  }

  /* Raciocínio Accordion */
  .thought-accordion {
    margin: 12px 0;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.2);
    border-left: 3px solid var(--accent);
    overflow: hidden;
  }

  .thought-accordion summary {
    padding: 8px 12px;
    font-size: 11px;
    font-weight: 700;
    color: var(--accent);
    cursor: pointer;
    list-style: none;
    display: flex;
    align-items: center;
    gap: 8px;
    user-select: none;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.8;
  }

  .thought-accordion summary::before {
    content: '◈';
    font-size: 14px;
    transition: transform 0.2s ease;
  }

  .thought-accordion[open] summary::before {
    transform: rotate(90deg);
  }

  .thought-content {
    padding: 12px;
    font-family: 'Space Grotesk', monospace;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    line-height: 1.4;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  .message-bubble pre {
    margin: 10px 0;
    border-radius: 12px;
    background: rgba(10, 12, 17, 0.55);
    padding: 12px;
    overflow: auto;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.4;
      transform: translateY(0);
    }
    50% {
      opacity: 1;
      transform: translateY(-2px);
    }
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes rise-in {
    from {
      opacity: 0;
      transform: translateY(34px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes send-feedback {
    0% {
      transform: scale(1);
    }
    40% {
      transform: scale(0.986);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes stream-caret {
    0%,
    100% {
      opacity: 0.2;
    }
    50% {
      opacity: 0.95;
    }
  }

  @keyframes send-bubble-pop {
    0% {
      transform: scale(1) translateY(0);
      box-shadow:
        0 3px 9px rgba(38, 45, 15, 0.28),
        inset 0 1px 1px rgba(255, 255, 255, 0.45),
        inset 0 -4px 8px rgba(84, 101, 27, 0.2);
      filter: brightness(1) saturate(1);
    }
    35% {
      transform: scale(0.92) translateY(1px);
      box-shadow:
        0 3px 8px rgba(55, 66, 20, 0.26),
        inset 0 1px 1px rgba(255, 255, 255, 0.4),
        inset 0 -3px 8px rgba(76, 91, 24, 0.2);
      filter: brightness(0.96) saturate(0.96);
    }
    70% {
      transform: scale(1.08) translateY(-1px);
      box-shadow:
        0 6px 14px rgba(72, 86, 24, 0.34),
        inset 0 1px 2px rgba(255, 255, 255, 0.62),
        inset 0 -5px 11px rgba(86, 103, 28, 0.28);
      filter: brightness(1.05) saturate(1.04);
    }
    100% {
      transform: scale(1) translateY(0);
      box-shadow:
        0 3px 9px rgba(38, 45, 15, 0.28),
        inset 0 1px 1px rgba(255, 255, 255, 0.45),
        inset 0 -4px 8px rgba(84, 101, 27, 0.2);
      filter: brightness(1) saturate(1);
    }
  }

  @media (max-width: 980px) {
    .chat-ui-shell {
      min-height: calc(100svh - 106px);
      gap: 12px;
      width: 100%;
    }

    .glass-chat {
      border-radius: 20px;
      padding: 14px;
      gap: 10px;
      min-height: clamp(360px, 48svh, 560px);
    }

    .messages-container {
      min-height: 0;
      height: 100%;
    }

    .chat-form {
      width: 100%;
    }

    .chat-form textarea {
      min-height: 56px;
      padding: 14px 54px 14px 18px;
      font-size: clamp(14px, 5.2vw, 20px);
      line-height: 1.2;
    }

    .chat-form button {
      width: 40px;
      height: 40px;
      right: 10px;
      bottom: 10px;
    }

    .message-bubble {
      max-width: 92%;
      font-size: 16px;
      border-radius: 14px;
      padding: 11px 13px;
    }

    .brand-pill {
      font-size: 20px;
      padding: 9px 16px;
      margin-top: 2px;
    }

    .brand-icon svg {
      width: 25px;
      height: 25px;
    }
  }
</style>
````

## File: src/components/SceneBackground.astro

````astro
---
---

<div class="scene-lights" aria-hidden="true">
  <div class="streak streak-a"></div>
  <div class="streak streak-b"></div>
  <div class="streak streak-c"></div>
  <div class="grain"></div>
  <div class="vignette"></div>
</div>

<style>
  .scene-lights {
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      radial-gradient(circle at 80% 24%, rgba(224, 202, 172, 0.46), transparent 40%),
      radial-gradient(circle at 12% 22%, rgba(211, 211, 215, 0.48), transparent 48%),
      linear-gradient(180deg, #3a3a3f 0%, #292a30 46%, #0f1016 100%);
  }

  .streak {
    position: absolute;
    top: -4%;
    bottom: -10%;
    width: min(22vw, 230px);
    filter: blur(3px);
    mix-blend-mode: screen;
    opacity: 0.34;
  }

  .streak-a {
    left: min(24vw, 320px);
    background: linear-gradient(90deg, rgba(252, 250, 244, 0), rgba(252, 250, 244, 0.66), rgba(252, 250, 244, 0));
  }

  .streak-b {
    left: min(49vw, 640px);
    width: min(20vw, 210px);
    opacity: 0.26;
    background: linear-gradient(90deg, rgba(247, 239, 227, 0), rgba(247, 239, 227, 0.55), rgba(247, 239, 227, 0));
  }

  .streak-c {
    left: min(67vw, 860px);
    width: min(18vw, 180px);
    opacity: 0.2;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.44), rgba(255, 255, 255, 0));
  }

  .grain {
    position: absolute;
    inset: 0;
    opacity: 0.08;
    background-image: radial-gradient(rgba(255, 255, 255, 0.6) 0.6px, transparent 0);
    background-size: 3px 3px;
    mix-blend-mode: soft-light;
  }

  .vignette {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 58%, rgba(0, 0, 0, 0.82) 100%);
  }
</style>
````

## File: src/layouts/Layout.astro

````astro
---
interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="generator" content={Astro.generator} />
    <title>{title}</title>
    <meta name="description" content="Chat AI uncensored - Privado e sem filtros" />
  </head>
  <body>
    <slot />
  </body>
</html>

<style is:global>
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');

  :root {
    --bg-dark: #181923;
    --text-strong: #f4f5f8;
    --text-soft: #c8c9cf;
    --text-dim: #a3a4aa;
    --accent: #b9d631;
    --glass-border: rgba(255, 255, 255, 0.22);
  }

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    min-height: 100%;
    background: var(--bg-dark);
    color: var(--text-strong);
    font-family: 'Manrope', 'Segoe UI', sans-serif;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: 'Space Grotesk', 'Manrope', sans-serif;
    margin: 0;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  ::-webkit-scrollbar {
    width: 9px;
    height: 9px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.22);
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.35);
  }
</style>
````

## File: src/pages/index.astro

````astro
---
import AstroChatInterface from '../components/AstroChatInterface.astro';
import Layout from '../layouts/Layout.astro';
import SceneBackground from '../components/SceneBackground.astro';
---

<Layout title="NEØ Uncensored Chat">
<script>
  if (import.meta.env.PROD && !localStorage.getItem('neo_token')) {
    window.location.replace('/login');
  }
</script>
  <main class="scene-shell">
    <SceneBackground />

    <AstroChatInterface />

    <footer class="scene-footer">
      <div class="footer-links">
        <a href="/login">Login</a>
        <span class="dot">•</span>
        <a href="/signup">Sign Up</a>
        <span class="dot">•</span>
        <a href="/upgrade">Upgrade</a>
      </div>
      <div class="footer-legal mt-2">
        <a href="/privacy-policy" aria-label="Política de Privacidade">Privacy Policy</a>
        <span class="dot">•</span>
        <a href="/terms-and-conditions" aria-label="Termos e Condições">Terms & Conditions</a>
      </div>
    </footer>
  </main>
</Layout>

<style>
  .scene-shell {
    position: relative;
    isolation: isolate;
    min-height: 100svh;
    padding: clamp(14px, 2.2vw, 28px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }

  .scene-footer {
    width: 100%;
    text-align: center;
    color: rgba(236, 236, 236, 0.44);
    font-size: clamp(14px, 1.9vw, 22px);
    line-height: 1.35;
    padding-bottom: clamp(12px, 1.8vw, 22px);
  }

  .scene-footer a {
    opacity: 0.78;
  }

  .scene-footer .dot {
    display: inline-block;
    margin: 0 14px;
    opacity: 0.42;
  }

  @media (max-width: 820px) {
    .scene-shell {
      padding-top: calc(env(safe-area-inset-top) + 8px);
      padding-right: max(8px, env(safe-area-inset-right));
      padding-bottom: calc(env(safe-area-inset-bottom) + 10px);
      padding-left: max(8px, env(safe-area-inset-left));
    }

    .scene-footer {
      font-size: 14px;
      padding-bottom: calc(env(safe-area-inset-bottom) + 4px);
    }

    .scene-footer .dot {
      margin: 0 10px;
    }
  }
</style>
````

## File: src/pages/login.astro

````astro
---
import Layout from '../layouts/Layout.astro';
import SceneBackground from '../components/SceneBackground.astro';
import Card from '../components/ui/Card.astro';
import Input from '../components/ui/Input.astro';
import Button from '../components/ui/Button.astro';
---

<Layout title="Login · NEØ">
  <main class="scene-shell">
    <SceneBackground />

    <div class="content-container">
      <Card class="w-full max-w-[440px]">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold mb-2 tracking-tight">Bem-vindo de volta</h1>
          <p class="text-[var(--text-soft)]">Acesse sua conta para continuar</p>
        </div>

        <form id="login-form" class="flex flex-col gap-5">
          <Input 
            type="email" 
            name="email" 
            id="email" 
            label="E-mail" 
            placeholder="seu@email.com" 
            required 
          />
          
          <Input 
            type="password" 
            name="password" 
            id="password" 
            label="Senha" 
            placeholder="••••••••" 
            required 
          />

          <div class="flex items-center justify-end">
            <a href="#" class="text-sm text-[var(--accent)] hover:underline opacity-80">Esqueceu a senha?</a>
          </div>

          <Button type="submit" class="mt-2" id="login-submit">
            Entrar
          </Button>
        </form>

        <div class="mt-8 text-center text-sm text-[var(--text-dim)]">
          Não tem uma conta? 
          <a href="/signup" class="text-[var(--accent)] font-semibold hover:underline ml-1">Crie uma agora</a>
        </div>
      </Card>

      <footer class="mt-8 text-center">
        <a href="/" class="text-sm text-[var(--text-dim)] hover:text-white transition-colors">
          ← Voltar para o início
        </a>
      </footer>
    </div>
  </main>
</Layout>

<script>
  const loginForm = document.getElementById('login-form') as HTMLFormElement;
  const submitBtn = document.getElementById('login-submit') as HTMLButtonElement;

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!submitBtn) return;

    const formData = new FormData(loginForm);
    const data = Object.fromEntries(formData.entries());

    submitBtn.disabled = true;
    submitBtn.innerText = 'Autenticando...';

    try {
      // Endpoint definido no runbook: /auth/login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.token) {
        localStorage.setItem('neo_token', result.token);
        window.location.href = '/';
      } else {
        alert(result.error || 'Erro ao fazer login. Verifique suas credenciais.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Erro de conexão. Tente novamente mais tarde.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Entrar';
    }
  });
</script>

<style>
  .scene-shell {
    position: relative;
    isolation: isolate;
    min-height: 100svh;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .content-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 10;
  }
</style>
````

## File: src/pages/privacy-policy.astro

````astro
---
import Layout from '../layouts/Layout.astro';
---

<Layout title="Política de Privacidade | NØX.ai">
  <main class="legal-shell">
    <article class="legal-card">
      <h1>Política de Privacidade</h1>
      <p>Este produto processa dados de conversa para entregar respostas do modelo e manter estabilidade operacional.</p>
      <p>Não compartilhe dados sensíveis sem necessidade. Para solicitações de remoção de dados, entre em contato com o suporte oficial.</p>
      <a href="/">Voltar</a>
    </article>
  </main>
</Layout>

<style>
  .legal-shell {
    min-height: 100svh;
    display: grid;
    place-items: center;
    padding: 24px;
    background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.08), transparent 48%), #11131a;
  }

  .legal-card {
    width: min(720px, 100%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
    padding: 24px;
    color: rgba(245, 245, 248, 0.95);
    display: grid;
    gap: 14px;
  }

  h1 {
    font-size: clamp(28px, 4vw, 42px);
  }

  p {
    margin: 0;
    line-height: 1.5;
    color: rgba(245, 245, 248, 0.82);
  }

  a {
    margin-top: 8px;
    width: fit-content;
    padding: 10px 16px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.08);
  }
</style>
````

## File: src/pages/signup.astro

````astro
---
import Layout from '../layouts/Layout.astro';
import SceneBackground from '../components/SceneBackground.astro';
import Card from '../components/ui/Card.astro';
import Input from '../components/ui/Input.astro';
import Button from '../components/ui/Button.astro';
---

<Layout title="Cadastro · NEØ">
  <main class="scene-shell">
    <SceneBackground />

    <div class="content-container">
      <Card class="w-full max-w-[440px]">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold mb-2 tracking-tight">Criar Conta</h1>
          <p class="text-[var(--text-soft)]">Junte-se à revolução do chat sem censura</p>
        </div>

        <form id="signup-form" class="flex flex-col gap-5">
          <Input 
            type="text" 
            name="name" 
            id="name" 
            label="Nome" 
            placeholder="Seu nome" 
            required 
          />

          <Input 
            type="email" 
            name="email" 
            id="email" 
            label="E-mail" 
            placeholder="seu@email.com" 
            required 
          />
          
          <Input 
            type="password" 
            name="password" 
            id="password" 
            label="Senha" 
            placeholder="••••••••" 
            required 
          />

          <p class="text-[10px] text-[var(--text-dim)] leading-relaxed text-center px-4">
            Ao se cadastrar, você concorda com nossos 
            <a href="/terms-and-conditions" class="underline hover:text-white">Termos de Serviço</a> e 
            <a href="/privacy-policy" class="underline hover:text-white">Política de Privacidade</a>.
          </p>

          <Button type="submit" class="mt-2" id="signup-submit">
            Criar Conta
          </Button>
        </form>

        <div class="mt-8 text-center text-sm text-[var(--text-dim)]">
          Já tem uma conta? 
          <a href="/login" class="text-[var(--accent)] font-semibold hover:underline ml-1">Fazer login</a>
        </div>
      </Card>

      <footer class="mt-8 text-center">
        <a href="/" class="text-sm text-[var(--text-dim)] hover:text-white transition-colors">
          ← Voltar para o início
        </a>
      </footer>
    </div>
  </main>
</Layout>

<script>
  const signupForm = document.getElementById('signup-form') as HTMLFormElement;
  const submitBtn = document.getElementById('signup-submit') as HTMLButtonElement;

  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!submitBtn) return;

    const formData = new FormData(signupForm);
    const data = Object.fromEntries(formData.entries());

    submitBtn.disabled = true;
    submitBtn.innerText = 'Criando conta...';

    try {
      // Endpoint sugerido (precisa ser confirmado no backend)
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.token) {
        localStorage.setItem('neo_token', result.token);
        window.location.href = '/';
      } else {
        alert(result.error || 'Erro ao criar conta. Tente novamente.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Erro de conexão. Tente novamente mais tarde.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Criar Conta';
    }
  });
</script>

<style>
  .scene-shell {
    position: relative;
    isolation: isolate;
    min-height: 100svh;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .content-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 10;
  }
</style>
````

## File: src/pages/success.astro

````astro
---
import Layout from '../layouts/Layout.astro';
---

<Layout title="NØX.ai - Sucesso">
  <div class="success-container">
    <div class="success-glass">
      <div class="success-icon-wrapper">
        <div class="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="glow"></div>
      </div>

      <h1 class="accent-text">Protocolo:Ativado</h1>
      <p class="message">
        Sua assinatura <span class="accent-text">PRO Engine</span> foi processada pelo FlowPay. 
        O acesso total aos modelos sem censura está liberado.
      </p>

      <div class="actions">
        <button onclick="window.location.href='/'" class="btn-primary">Acessar Terminal</button>
      </div>
      
      <p class="nexus-badge">Identidade Nexus Sincronizada</p>
    </div>
  </div>

  <style>
    .success-container {
      min-height: 100svh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: radial-gradient(circle at 50% 50%, #1a1a1a 0%, #0a0a0a 100%);
      font-family: 'Space Grotesk', sans-serif;
    }

    .success-glass {
      width: 100%;
      max-width: 500px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 60px 40px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    }

    .success-icon-wrapper {
      position: relative;
      width: 80px;
      height: 80px;
      margin: 0 auto 30px;
    }

    .success-icon {
      width: 100%;
      height: 100%;
      background: var(--accent);
      color: #000;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      position: relative;
      z-index: 2;
      animation: pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .glow {
      position: absolute;
      inset: -10px;
      background: var(--accent);
      border-radius: 50%;
      filter: blur(20px);
      opacity: 0.4;
      z-index: 1;
      animation: pulse 2s infinite ease-in-out;
    }

    .accent-text {
      color: var(--accent);
      text-shadow: 0 0 20px rgba(206, 229, 92, 0.3);
      font-weight: 800;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 20px;
      letter-spacing: -0.05em;
    }

    .message {
      color: rgba(255,255,255,0.7);
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 40px;
    }

    .btn-primary {
      width: 100%;
      padding: 16px;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      background: var(--accent);
      border: none;
      color: #000;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .btn-primary:hover {
      transform: scale(1.02);
      box-shadow: 0 0 20px rgba(206, 229, 92, 0.4);
    }

    .nexus-badge {
      margin-top: 30px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      opacity: 0.3;
    }

    @keyframes pop {
      0% { transform: scale(0.5); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes pulse {
      0% { transform: scale(1); opacity: 0.4; }
      50% { transform: scale(1.2); opacity: 0.2; }
      100% { transform: scale(1); opacity: 0.4; }
    }
  </style>
</Layout>

<style>
  .scene-shell {
    position: relative;
    isolation: isolate;
    min-height: 100svh;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .content-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 10;
  }

  .success-icon {
    position: relative;
    width: 80px;
    height: 80px;
    margin: 0 auto;
  }

  .icon-circle {
    width: 100%;
    height: 100%;
    background: var(--accent);
    color: #181923;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    position: relative;
    z-index: 2;
    animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  .icon-circle svg {
    width: 100%;
    height: 100%;
  }

  .glow {
    position: absolute;
    inset: -10px;
    background: var(--accent);
    border-radius: 50%;
    filter: blur(20px);
    opacity: 0.4;
    z-index: 1;
    animation: pulse 2s infinite ease-in-out;
  }

  @keyframes scaleIn {
    from { transform: scale(0.5); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  @keyframes pulse {
    0% { transform: scale(1); opacity: 0.4; }
    50% { transform: scale(1.2); opacity: 0.2; }
    100% { transform: scale(1); opacity: 0.4; }
  }
</style>
````

## File: src/pages/terms-and-conditions.astro

````astro
---
import Layout from '../layouts/Layout.astro';
---

<Layout title="Termos e Condições | NØX.ai">
  <main class="legal-shell">
    <article class="legal-card">
      <h1>Termos e Condições</h1>
      <p>Ao usar esta interface, você concorda em utilizar o serviço de forma legal e responsável, sem violar direitos de terceiros.</p>
      <p>As respostas podem conter imprecisões. Sempre valide decisões críticas antes de executar ações em produção ou ambientes sensíveis.</p>
      <a href="/">Voltar</a>
    </article>
  </main>
</Layout>

<style>
  .legal-shell {
    min-height: 100svh;
    display: grid;
    place-items: center;
    padding: 24px;
    background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.08), transparent 48%), #11131a;
  }

  .legal-card {
    width: min(720px, 100%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
    padding: 24px;
    color: rgba(245, 245, 248, 0.95);
    display: grid;
    gap: 14px;
  }

  h1 {
    font-size: clamp(28px, 4vw, 42px);
  }

  p {
    margin: 0;
    line-height: 1.5;
    color: rgba(245, 245, 248, 0.82);
  }

  a {
    margin-top: 8px;
    width: fit-content;
    padding: 10px 16px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.08);
  }
</style>
````

## File: src/pages/upgrade.astro

````astro
---
import Layout from '../layouts/Layout.astro';
---

<Layout title="NØX.ai - Upgrade">
  <div class="upgrade-container">
    <div class="upgrade-glass">
      <div class="upgrade-header">
        <h1 class="accent-text">NØX:Upgrade</h1>
        <p>Acesso total ao Protocolo de Processamento.</p>
      </div>
      
      <div class="pricing-grid">
        <!-- Free Plan -->
        <div class="price-card tier-free">
          <h3>Standard</h3>
          <div class="price">R$ 0<span>/ciclo</span></div>
          <ul class="features">
            <li>100 processamentos/dia</li>
            <li>Modelo Venice Base</li>
            <li>Latência normal</li>
          </ul>
          <button class="btn-disabled" disabled>Nível Atual</button>
        </div>

        <!-- Pro Plan -->
        <div class="price-card tier-pro active">
          <div class="badge">Recomendado</div>
          <h3>Pro Engine</h3>
          <div class="price">R$ 49<span>/ciclo</span></div>
          <ul class="features">
            <li>Processamento Ilimitado</li>
            <li>Todos os modelos Premium</li>
            <li>Deep Analysis Ativo</li>
            <li>Suporte Prioritário</li>
          </ul>
          <button onclick="handleFlowPay()" class="btn-primary">Ativar com FlowPay</button>
        </div>
      </div>

      <div class="nexus-integration">
        <p>Ou conecte sua identidade Nexus</p>
        <button onclick="connectNexus()" class="btn-nexus">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          Nexus:Connect
        </button>
      </div>
      
      <a href="/" class="back-link">← Retornar ao Terminal</a>
    </div>
  </div>

  <style>
    .upgrade-container {
      min-height: 100svh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: radial-gradient(circle at 50% 50%, #1a1a1a 0%, #0a0a0a 100%);
      font-family: 'Space Grotesk', sans-serif;
    }

    .upgrade-glass {
      width: 100%;
      max-width: 900px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 60px 40px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    }

    .upgrade-header h1 {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 10px;
      letter-spacing: -0.05em;
    }

    .accent-text {
      color: var(--accent);
      text-shadow: 0 0 20px rgba(206, 229, 92, 0.3);
    }

    .upgrade-header p {
      color: rgba(255,255,255,0.5);
      font-size: 1.1rem;
      margin-bottom: 50px;
    }

    .pricing-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 40px;
    }

    .price-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 20px;
      padding: 40px;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
    }

    .price-card.active {
      border-color: rgba(206, 229, 92, 0.3);
      background: rgba(206, 229, 92, 0.02);
      transform: translateY(-5px);
    }

    .badge {
      align-self: center;
      background: var(--accent);
      color: #000;
      font-size: 10px;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 99px;
      text-transform: uppercase;
      margin-bottom: 20px;
    }

    .price-card h3 {
      font-size: 1.5rem;
      margin-bottom: 10px;
    }

    .price {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 30px;
    }

    .price span {
      font-size: 1rem;
      opacity: 0.5;
    }

    .features {
      list-style: none;
      padding: 0;
      margin: 0 0 40px 0;
      text-align: left;
      flex: 1;
    }

    .features li {
      margin-bottom: 12px;
      color: rgba(255,255,255,0.7);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .features li::before {
      content: '→';
      color: var(--accent);
    }

    button {
      width: 100%;
      padding: 16px;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .btn-primary {
      background: var(--accent);
      border: none;
      color: #000;
    }

    .btn-primary:hover {
      transform: scale(1.02);
      box-shadow: 0 0 20px rgba(206, 229, 92, 0.4);
    }

    .btn-disabled {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.3);
      cursor: default;
    }

    .nexus-integration {
      margin-top: 40px;
      padding-top: 40px;
      border-top: 1px solid rgba(255,255,255,0.05);
    }

    .nexus-integration p {
      font-size: 0.9rem;
      opacity: 0.4;
      margin-bottom: 15px;
    }

    .btn-nexus {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.2);
      color: #fff;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      width: auto;
      padding: 10px 24px;
    }

    .btn-nexus:hover {
      background: rgba(255,255,255,0.05);
      border-color: #fff;
    }

    .back-link {
      display: block;
      margin-top: 30px;
      color: rgba(255,255,255,0.3);
      text-decoration: none;
      font-size: 0.9rem;
    }

    .back-link:hover {
      color: #fff;
    }

    @media (max-width: 768px) {
      .pricing-grid {
        grid-template-columns: 1fr;
      }
      .upgrade-glass {
        padding: 40px 20px;
      }
    }
  </style>

  <script is:inline>
    function handleFlowPay() {
      const token = localStorage.getItem('neo_token');
      if (!token) {
        window.location.href = '/login';
        return;
      }
      // Redirecionamento para o ecossistema FlowPay
      // Em produção, isso levaria para o app.flowpay.cash com os parâmetros do usuário
      alert("Redirecionando para o Gateway FlowPay (Nexus Architecture)...");
      window.location.href = "https://flowpay.cash/checkout?product=nox_pro&callback=" + encodeURIComponent(window.location.origin + '/success');
    }

    async function connectNexus() {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          alert('Identidade Nexus detectada: ' + accounts[0]);
        } catch (err) {
          console.error('Nexus error:', err);
        }
      } else {
        alert('Nexus Protocol não detectado. Instale a wallet oficial.');
      }
    }
  </script>
</Layout>
yout>
````

## File: src/env.d.ts

````typescript
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
````

## File: .cursorrules

````box
# NΞØ Protocol · Frontend Canonical Rules (Astro)

Este projeto é a interface soberana do ecossistema. Siga estas regras específicas ao atuar aqui:

## 📚 Documentação Local

- Consulte `src/env.d.ts` para definições de variáveis de ambiente.
- Respeite o `astro.config.mjs` para integrações de Tailwind e MDX.

## 🏗️ Regras de Desenvolvimento (Frontend)

### 1. Estética & UI

- **Wow Aesthetics**: Interface premium é mandatória.
- **Gradients & Glassmorphism**: Use o esquema de cores HSL definido no projeto.
- **Micro-animações**: Todas as interações devem ter feedback visual suave.

### 2. Stack Técnica

- **Astro**: Use componentes `.astro` para lógica de servidor e componentes React apenas para ilhas de interatividade necessária.
- **Tailwind CSS**: Utilize apenas as utilidades padrão; evite CSS inline fora do Tailwind, a menos que seja para animações complexas.
- **Types**: Se encontrar erro em `import.meta.env`, execute `pnpm astro sync`.

### 3. SEO & Performance

- Toda página deve ter meta tags de SEO e título descritivo.
- Imagens devem ser otimizadas usando o componente `<Image />` do Astro.

---
*Referência Global: Consulte o .cursorrules na raiz para regras de Tom e teaBASE.*
````

## File: .env.example

````keys
# Venice AI
VENICE_API_KEY=....
VENICE_MODEL=llama-3.3-70b

# JWT
JWT_SECRET=....

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...

# Infrastructure (Railway cria automaticamente)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Config
FRONTEND_URL=http://localhost:4321
PUBLIC_API_URL=http://localhost:3001
````

## File: .gitignore

````select
# Build output
dist/
.astro/

# Dependencies
node_modules/

# Environment secrets
.env
.env.local
.env.*.local
backend/.env

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Editor directories and files
.vscode/
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
````

## File: astro.config.mjs

````javascript
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [tailwind()],
  devToolbar: {
    enabled: false
  }
});
````

## File: Makefile

````makefile
# ========================================
#      NΞØ · PROJECT CONTROL PLANE
# ========================================
# Project: neo-chat-uncensored
# Version: 1.3.0 (Quality Gate Integrated)
# ========================================

.PHONY: help init install dev dev-fe dev-be stop check verify audit lint build push clean logs

# --- CONFIGURATION ---
PNPM = pnpm

# --- HELP ---
help:
 @echo "NΞØ Protocol · neo-chat-uncensored"
 @echo "────────────────────────────────────────"
 @echo "Usage: make [target]"
 @echo ""
 @echo "1. INITIALIZATION"
 @echo "  init          Cria .env a partir de .env.example + instala deps"
 @echo "  install       Instala todas as dependências do projeto"
 @echo ""
 @echo "2. DEVELOPMENT"
 @echo "  dev           Inicia Frontend + Backend simultaneamente"
 @echo "  dev-fe        Inicia apenas o Frontend (Astro :4321)"
 @echo "  dev-be        Inicia apenas o Backend (Express :3001)"
 @echo "  stop          Limpa portas 3001 e 4321 (kill processes)"
 @echo "  logs          Visualiza logs em tempo real do backend"
 @echo ""
 @echo "3. QUALITY & CHECK (Obrigatório antes do Push)"
 @echo "  check         Roda TUDO: verify + audit + lint"
 @echo "  verify        Valida integridade do ambiente e configurações"
 @echo "  audit         Auditoria de segurança de dependências"
 @echo "  lint          Verifica padrões de código (placeholder)"
 @echo "  clean         Remove artefatos de build e node_modules"
 @echo ""
 @echo "4. BUILD & PRODUCTION"
 @echo "  build         Build de produção (Astro static/hybrid)"
 @echo "  push          Secure Gate: check + build + git status"
 @echo "────────────────────────────────────────"

# --- 1. INITIALIZATION ---
init:
 @if [ ! -f .env ]; then \
  echo "📝 Creating .env from example..."; \
  cp .env.example .env; \
 fi
 $(MAKE) install

install:
 @echo "📦 Installing workspace dependencies..."
 $(PNPM) install

# --- 2. DEVELOPMENT ---
dev:
 @echo "🚀 Starting NΞØ Ecosystem..."
 @($(PNPM) dev) & (cd backend && $(PNPM) dev) & wait

stop:
 @echo "🛑 Killing processes on ports 3001 and 4321..."
 @lsof -ti:3001 | xargs kill -9 2>/dev/null || true
 @lsof -ti:4321 | xargs kill -9 2>/dev/null || true
 @echo "✅ Ports cleared."

dev-be:
 @echo "🔌 Starting Backend..."
 cd backend && $(PNPM) dev

dev-fe:
 @echo "🎨 Starting Frontend..."
 $(PNPM) dev

logs:
 @echo "📋 Streaming Backend Logs..."
 tail -f backend/app.log

# --- 3. QUALITY & CHECK ---
check: verify audit lint
 @echo "✅ All checks passed successfully."

verify:
 @echo "🔍 Verifying Project Integrity..."
 @if [ ! -f .env ]; then echo "❌ Error: .env file missing!"; exit 1; fi
 @if [ ! -f docs/SYSTEM_PROMPT.md ]; then echo "❌ Error: docs/SYSTEM_PROMPT.md missing!"; exit 1; fi
 @echo "  - Environment: OK"
 @echo "  - Docs & Persona: OK"
 @echo "  - Node Version: `node -v`"
 @echo "✅ Integrity verified."

audit:
 @echo "🛡️  Running Security Audit..."
 $(PNPM) audit

lint:
 @echo "✨ Linting (via Astro check)..."
 @if [ -d node_modules/@astrojs/check ]; then \
  $(PNPM) astro check; \
 else \
  echo "⚠️  Astro check ignorado (dependências pendentes)."; \
 fi

clean:
 @echo "🧹 Cleaning artifacts..."
 rm -rf dist .astro
 find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
 @echo "✨ Clean complete."

# --- 4. BUILD & PRODUCTION ---
build:
 @echo "🏗️  Building production assets..."
 @echo "📦 Ensuring dependencies are synced..."
 $(PNPM) install
 @echo "🧹 Resetting Astro build cache..."
 rm -rf dist .astro
 $(PNPM) run build

push:
 @echo "🚀 Starting Secure Push Protocol..."
 @$(MAKE) check
 @$(MAKE) build
 @echo "✅ Full quality gate passed. Ready to commit."
 @git status
````

## File: NEXTSTEPS.md

````markdown
<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
========================================
    NEXT STEPS · RUNBOOK OPERACIONAL
========================================

> **Status:** PRÉ-MVP (bug fixes pendentes antes do launch)  
> **Workspace:** Chat-as-a-Protocol / neo-chat-uncensored  
> **Branch:** main

────────────────────────────────────────

## ⧉ Estado Atual

```text
Workspace : Chat-as-a-Protocol / neo-chat-uncensored
Branch    : main
Fase      : PRÉ-MVP (bug fixes pendentes antes do launch)
```

────────────────────────────────────────

## ⧉ Páginas e Rotas

- `/` → chat principal (`src/pages/index.astro`)
- `/login` → autenticação (`src/pages/login.astro`)
- `/signup` → cadastro (`src/pages/signup.astro`)
- `/success` → confirmação de pagamento (`src/pages/success.astro`)
- `/upgrade` → planos (`src/pages/upgrade.astro`)
- `/privacy-policy` → política (`src/pages/privacy-policy.astro`)
- `/terms-and-conditions` → termos (`src/pages/terms-and-conditions.astro`)

────────────────────────────────────────

## ⧉ API Backend

- `POST /api/chat` → streaming SSE para Venice AI
- `GET /api/models` → modelos disponíveis da Venice
- `GET /api/usage` → consumo diário do usuário
- `POST /api/auth/login` → gera JWT (bcrypt implementado)
- `POST /api/auth/signup` → cria conta (bcrypt implementado)
- `POST /stripe/create-checkout` → inicia checkout Stripe (a migrar para FlowPay)
- `POST /webhooks/stripe` → webhook de assinatura (a migrar para FlowPay via Nexus)

────────────────────────────────────────

## ⟠ Checklist de Estado

### Infraestrutura

- [x] Astro migrado para v6 com output estático
- [x] Workspace pnpm configurado (`pnpm-workspace.yaml`)
- [x] SceneBackground extraído como componente reutilizável
- [x] Componentes UI reutilizáveis: `Button`, `Card`, `Input`
- [x] Layout global com design tokens CSS (accent, glass, tipografia)
- [x] Tailwind configurado com `@astrojs/tailwind`

### Auth e Backend

- [x] Página `/login` criada com formulário e integração à API
- [x] Página `/signup` criada com formulário e integração à API
- [x] Página `/success` criada (retorno do checkout)
- [x] Backend: bcrypt (custo 12) para hash de senha no signup
- [x] Backend: verificação bcrypt no login
- [x] Backend: JWT sem fallback hardcoded — ephemeral em dev, fatal em prod
- [x] Backend: validação de env vars obrigatórias na inicialização de produção
- [x] Backend: Stripe webhook com `express.raw()` antes do `express.json()`
- [x] Backend: `trust proxy 1` para Railway + AbortError → 504
- [x] Backend: rate limit no webhook Stripe
- [x] Backend: Mock Redis in-memory para dev (sem Docker)
- [x] Backend: helmet, CORS, rate limiting por usuário e por tier
- [x] Backend: validação de input com Zod
- [x] `backend/package-lock.json` npm removido — workspace gerenciado por pnpm

### Chat UI

- [x] Streaming SSE com cursor animado
- [x] Typing indicator (pontos animados)
- [x] Auto-scroll inteligente (detecta se usuário está no fundo)
- [x] Retry em caso de erro
- [x] Escape HTML para prevenir XSS
- [x] Formatação básica: bold, code blocks
- [x] Timestamp por mensagem
- [x] Animação de send (bounce)
- [x] Textarea auto-resize
- [x] Enter para enviar, Shift+Enter para nova linha

────────────────────────────────────────

## ⨷ Fase 0 · Bug Fixes

> **Importante:** Executar antes de qualquer deploy de produção.

- [x] **[BUG] Token key inconsistente em `upgrade.astro`**
  - Arquivo: `src/pages/upgrade.astro`
  - Fix aplicado: `'token'` → `'neo_token'`

- [x] **[BUG] `window.PUBLIC_API_URL` não funciona no browser**
  - Arquivo: `src/pages/upgrade.astro`
  - Fix aplicado: `is:inline` substituído por `define:vars` com `import.meta.env.PUBLIC_API_URL`

- [x] **[UX] Signup não usa o token retornado**
  - Arquivo: `src/pages/signup.astro`
  - Fix aplicado: salva `neo_token` no localStorage + redirect direto para `/`

- [x] **[LINK] Link `/docs` em `success.astro`**
  - Arquivo: `src/pages/success.astro`
  - Fix aplicado: link duplicado removido (já havia botão "Ir para o Chat")
  - `docs/` reestruturado como Knowledge Base soberana (README, ARCHITECTURE, API, PAYMENTS, DEPLOY)
  - Banner SVG movido de `docs/assets/` para `public/` (propósito correto)

- [x] **[AUTH] Auth guard no frontend para produção**
  - Arquivo: `src/pages/index.astro`
  - Fix aplicado: redirect para `/login` quando `neo_token` ausente em `import.meta.env.PROD`

────────────────────────────────────────

## ⟠ Fase 1 · MVP Completo

### Persona e Experience

- [x] **System prompt / persona NØX.ai**
  - Conteúdo em `docs/SYSTEM_PROMPT.md`
  - Integração no `backend/src/server.js` concluída (injeção via `system` message)

- [x] **Indicador de quota no chat**
  - Exibição dinâmica de `uso/limite` integrada na Brand Pill
  - Atualização automática após cada mensagem

- [ ] **Finalizar Fontes Locais (Privacidade)**
  - [x] Infraestrutura e CSS configurados em `Layout.astro`
  - [ ] **Ação Requerida**: Fazer upload de `manrope-variable.ttf` e `space-grotesk-variable.ttf` para `public/fonts/`

- [x] **Consolidação de Documentação e Limpeza**
  - [x] Pasta `neo-ai/` eliminada; arquivos críticos movidos para `docs/`
  - [x] Duplicatas de `ARCHITECTURE.md` e `README.md` removidas
  - [x] Referências de estilo centralizadas no diretório pai `Chat-as-a-Protocol`

- [x] **Refino da Interface (UX)**
  - [x] Revisar mensagem de abertura para alinhar 100% com NØX.ai
  - [x] Remover logs de depuração do console em `AstroChatInterface.astro`

────────────────────────────────────────

## ⟠ Fase 2 · FlowPay

> **Contexto**: este projeto faz parte do ecossistema NEO Protocol.
> O padrão de pagamento canônico do ecossistema usa **FlowPay** como
> único gateway, mediado pelo **Nexus** (event hub), **não Stripe**.
> Ver `docs/CONTEXT.md` para detalhes completos do padrão.

### Padrão de Integração

```text
FlowPay (api.flowpay.cash)
  → emite FLOWPAY:PAYMENT_RECEIVED para Nexus
    → Nexus (nexus.neoprotocol.space/api/events)
      → entrega para neo-chat-uncensored via /webhooks/flowpay
        → backend atualiza tier do usuário no Redis
```

### Checklist de Migração Stripe → FlowPay

- [ ] Declarar `neo-chat-uncensored` como nó consumidor no `ecosystem.json`
  - Arquivo: `neobot-orchestrator/config/ecosystem.json`
  - Adicionar `nexusEvents.subscriptions[]`
  - Evento: `"FLOWPAY:PAYMENT_RECEIVED"`
  - `secretEnv`: `NEO_CHAT_WEBHOOK_SECRET`
  - `target.path`: `/webhooks/flowpay`

- [x] Criar endpoint `POST /webhooks/flowpay` no backend
- [x] Remover vestígios do Stripe no backend e frontend
- [x] Atualizar o botão "Upgrade" no frontend para apontar para o FlowPay
- [ ] Validar assinatura `X-Nexus-Signature` (HMAC-SHA256)
- [ ] Processar `FLOWPAY:PAYMENT_RECEIVED` de forma idempotente
  - Atualizar tier do usuário no Redis (equivalente ao atual webhook Stripe)

- [ ] Substituir `POST /stripe/create-checkout` por `POST /flowpay/create-charge`
  - API FlowPay: `POST https://api.flowpay.cash/api/create-charge`
  - Env vars: `FLOWPAY_API_URL`, `FLOWPAY_API_KEY`
  - Retorna URL de checkout gerenciado pela FlowPay

- [ ] Atualizar `upgrade.astro` para chamar `/flowpay/create-charge`

- [ ] Remover dependência do Stripe quando FlowPay estiver operacional

────────────────────────────────────────

## ⟠ Fase 3 · Crescimento

- [ ] Banco de dados real para usuários (Turso/PostgreSQL) em vez de Redis puro
- [ ] Histórico de conversas — local ou criptografado no server
- [ ] Password reset flow (email via Resend ou FlowPay)
- [ ] Personas customizáveis (system prompts pré-definidos pelo usuário)
- [ ] Contagem real de tokens no streaming (ao invés da heurística atual)

────────────────────────────────────────

## ⟠ Fase 4 · Escala e Web3

- [ ] Pagamento crypto: integração com FlowPay token (NEOPAY / ERC-20 na Base)
  - Contrato: `0xD49d3Fb2C2CBBA78a1E710660a628919eE78D82A`
- [ ] API key para desenvolvedores (Chat as a Protocol)
- [ ] Multi-tenant: domínio próprio por cliente (white-label)
- [ ] Rate limit por IP em `/api/auth` (além do por usuário existente)

────────────────────────────────────────

## ◬ Deploy Railway

### Serviço A: API (Node/Express)

- `Root Directory`: `backend`
- `Build Command`: `pnpm install --frozen-lockfile`
- `Start Command`: `pnpm start`
- Porta: Railway injeta `PORT` automaticamente

#### Variáveis obrigatórias (API)

```env
NODE_ENV=production
FRONTEND_URL=https://<seu-app-domain>
VENICE_API_KEY=...
VENICE_MODEL=venice-uncensored-1-2
JWT_SECRET=...
REDIS_URL=...
FLOWPAY_API_URL=https://api.flowpay.cash
FLOWPAY_API_KEY=...
NEO_CHAT_WEBHOOK_SECRET=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_ID_PRO=...
```

### Webhook FlowPay via Nexus

Configurar no `ecosystem.json` do NEO Protocol:

```json
{
  "id": "neo-chat-uncensored",
  "nexusEvents": {
    "subscriptions": [
      {
        "event": "FLOWPAY:PAYMENT_RECEIVED",
        "target": {
          "kind": "webhook",
          "path": "/webhooks/flowpay"
        },
        "secretEnv": "NEO_CHAT_WEBHOOK_SECRET"
      }
    ]
  }
}
```

### Serviço B: App (Astro estático)

- `Root Directory`: `/` (raiz do repo)
- `Build Command`: `pnpm install --frozen-lockfile && pnpm build`
- `Start Command`: `pnpm dlx serve dist -l $PORT`

#### Variáveis obrigatórias (App)

```env
PUBLIC_API_URL=https://<api-domain>
```

────────────────────────────────────────

## ◬ Comandos Locais

```bash
# Instalar dependências (workspace completo)
pnpm install

# Desenvolvimento (frontend + backend separados)
make dev

# Build produção
make build
```

────────────────────────────────────────

## ⟠ Checklist de Publicação

1. [ ] Corrigir todos os bugs da Fase 0
2. [ ] Subir API no Railway (`backend` root)
3. [ ] Subir Redis no Railway e conectar `REDIS_URL`
4. [ ] Configurar variáveis da API
5. [ ] Subir App com `PUBLIC_API_URL` apontando para API
6. [ ] Testar fluxo completo:
   - [ ] abrir `/` e enviar mensagem (stream)
   - [ ] criar conta em `/signup` e ser redirecionado para chat
   - [ ] fazer login em `/login`
   - [ ] abrir `/upgrade` e iniciar checkout
   - [ ] confirmar webhook alterando tier
7. [ ] (Fase 2) Declarar `neo-chat-uncensored` no `ecosystem.json`
8. [ ] (Fase 2) Configurar Nexus para entregar `FLOWPAY:PAYMENT_RECEIVED`

────────────────────────────────────────

```text
▓▓▓ NΞØ MELLØ
────────────────────────────────────────
Core Architect · NΞØ Protocol
neo@neoprotocol.space

"Code is law. Expand until
chaos becomes protocol."

Security by design.
Explits find no refuge here.
────────────────────────────────────────
```
````

## File: package.json

````json
{
  "name": "neo-chat-uncensored-frontend",
  "type": "module",
  "version": "1.0.0",
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "lint": "astro check",
    "check": "astro check"
  },
  "dependencies": {
    "@astrojs/tailwind": "^5.1.0",
    "astro": "^6.1.6",
    "tailwindcss": "^3.4.1"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.8",
    "typescript": "~5.7.3"
  },
  "pnpm": {
    "overrides": {
      "yaml": "^2.8.3"
    }
  }
}
````

## File: pnpm-workspace.yaml

````yaml
packages:
  - '.'
  - 'backend'
allowBuilds:
  esbuild: true
  sharp: true
````

## File: railway.json

````json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install --frozen-lockfile && pnpm build"
  },
  "deploy": {
    "startCommand": "pnpm dlx serve dist -l $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/"
  }
}
````

## File: README.md

````markdown
# Title: NØX.ai (Neo-Chat-Uncensored)

```text
========================================
     NØX.ai · PROCESSING ENGINE
========================================
```

![neo-chat-uncensored banner](./public/neo-chat-uncensored-banner.svg)

> **Version:** v2.0.0 (Processing Engine)  
> **Status:** Operational · Blasé Persona Ativa
> **Framework:** Astro 6.x / Node 22+
> **Protocol:** NΞØ Nexus / FlowPay (No Stripe)

## ⟠ Objetivo

Interface soberana e minimalista para processamento de modelos de IA sem censura. 
A NØX.ai opera como uma engine técnica, removendo verniz social e focando em saída bruta de dados.

O sistema utiliza arquitetura Astro 6 nativa, garantindo performance instantânea, 
integridade de contexto e comunicação via SSE (Server-Sent Events).

────────────────────────────────────────

## ⧉ Arquitetura

O ecossistema é uma implementação canônica do NΞØ Protocol, utilizando FlowPay como gateway único e Nexus como barramento de eventos.

```text
▓▓▓ SYSTEM TOPOLOGY
────────────────────────────────────────
└─ Root (Astro 6.x)
   ├─ src/pages/ (Static Routes)
   ├─ src/components/ (Astro/Vanilla Components)
   └─ public/ (Static Assets & Logo)

└─ Backend (Express/Node.js)
   ├─ src/server.js (Core Logic)
   └─ .env (Sensitive Context)
────────────────────────────────────────
```

### 1. Frontend (Astro)

Componentização baseada em Astro e scripts Vanilla JS.
Utiliza Server-Sent Events (SSE) para streaming de tokens em tempo real.
Design System: Glassmorphism / Cyberpunk (Tailwind CSS puro).

### 2. Backend (Proxy)

Gateway seguro para a Venice AI API.
Gerenciamento de rate limiting, quotas diárias e integração com Stripe.
Bypass de autenticação em modo desenvolvimento para agilidade operacional.

────────────────────────────────────────

## ⨷ Comandos

Todos os comandos devem ser executados via `pnpm` para garantir consistência do lockfile.

```bash
# Inicializar ambiente e dependências
make install

# Iniciar ecossistema completo (FE + BE)
make dev

# Auditoria de segurança e integridade
make audit
make verify

# Build de produção
make build
```

────────────────────────────────────────

## ⍟ Segurança

- **Zero Bloat**: Removido Framer Motion, Zustand e React-Three-Fiber.
- **Privacy First**: Chaves de API nunca tocam o cliente; processamento via proxy.
- **Context Engineering**: Manifestos de integridade em `docs/CONTEXT.md`.

────────────────────────────────────────

```text
▓▓▓ NΞØ MELLØ
────────────────────────────────────────
Core Architect · NΞØ Protocol
neo@neoprotocol.space

"Code is law. Expand until
chaos becomes protocol."

Security by design.
Exploits find no refuge here.
────────────────────────────────────────
```
````

## File: start.sh

````bash
#!/bin/bash
echo "🚀 Iniciando Sua Marca IA..."
echo ""
# Verificar se .env existe
if [ ! -f .env ]; then
  echo "⚠️  Criando .env a partir do exemplo..."
  cp .env.example .env
  echo "📝 Edite o arquivo .env com suas credenciais!"
  exit 1
fi
# Verificar se backend/.env existe
if [ ! -f backend/.env ]; then
  echo "⚠️  Criando backend/.env a partir do exemplo..."
  cp backend/.env.example backend/.env
  echo "📝 Edite o arquivo backend/.env com suas credenciais!"
fi
# Iniciar ecossistema via Makefile
echo "📦 Verificando dependências..."
make install
echo "🔌 Iniciando Frontend e Backend..."
make dev
echo ""
echo "✅ Sistema iniciado!"
echo "📖 Próximos passos:"
echo "   1. Obtenha sua API key em: https://venice.ai/settings/api"
echo "   2. Verifique seu .env: VENICE_API_KEY deve estar configurada"
echo "   3. Docs em: README.md"
````

## File: tailwind.config.mjs

````javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
````

## File: tsconfig.json

````json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@ledger/*": ["./neo-flow-system/packages/ledger/src/*"],
      "@risk-engine/*": ["./neo-flow-system/packages/risk-engine/src/*"],
      "@shared/*": ["./neo-flow-system/packages/shared/src/*"],
      "@providers/base/*": ["./neo-flow-system/packages/providers/base/src/*"],
      "@providers/venice/*": [
        "./neo-flow-system/packages/providers/venice/src/*"
      ],
      "@providers/cryptomus/*": [
        "./neo-flow-system/packages/providers/cryptomus/src/*"
      ],
      "@providers/flowpay/*": [
        "./neo-flow-system/packages/providers/flowpay/src/*"
      ],
      "@providers/uniswap/*": [
        "./neo-flow-system/packages/providers/uniswap/src/*"
      ]
    }
  },
  "include": [
    "**/*.astro",
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/*.mjs",
    "**/*.cjs"
  ],
  "exclude": ["dist"]
}
````
