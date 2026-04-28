<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# NΞØ · CONTEXT CHANGELOG

```text
========================================
     CHANGELOG · CONTEXT ENGINEERING
========================================
Status : ACTIVE
========================================
```

> **Registry:** Todas as mudanças significativas na ontologia, regras
> ou estrutura de contexto do projeto.

────────────────────────────────────────

## ⧖ [2.1.0] — 2026-04-28

### **Security Hardening**
- Webhook FlowPay agora exige `FLOWPAY_WEBHOOK_SECRET` com validação HMAC-SHA256
  usando `crypto.timingSafeEqual` (previa implementação era TODO sem validação real).
- `userId` migrado de `base64(email)` reversível para `SHA-256(email)` unidirecional.
- Login agora timing-safe: `bcrypt.compare` executado mesmo para emails inexistentes
  (previne user enumeration attack).
- CORS substituído de string para função de validação por origem — sem wildcard.
- Body limit `express.json({ limit: "64kb" })` adicionado (anti-DoS).
- CSP headers habilitados via helmet com whitelist da Venice AI.

### **Robustez**
- `express.json` sem limite removido — substituído por `{ limit: "64kb" }`.
- System prompt em cache de memória (boot-time) — eliminado I/O por request.
- `TextDecoder` reutilizado no loop de stream (era criado a cada chunk).
- `reader.releaseLock()` garantido via `try/finally` — previne memory leak.
- Signup agora usa pipeline Redis atômico (set password + tier + limit juntos).
- `ledger.ltrim` — lista limitada a 1000 entradas por usuário.
- `JSON.parse` no ledger agora com `safeParseEntry` (entradas corrompidas não derrubam a chamada).
- `checkQuota` agora com try/catch — Redis falha não mais causa crash silencioso.
- Graceful shutdown: `SIGTERM`, `SIGINT`, `unhandledRejection`, `uncaughtException`.

### **Performance**
- Schema Zod do `/api/chat` movido para escopo de módulo (criado uma vez, não por request).
- `/api/models` e `/api/usage` paralelizados com `Promise.all`.
- `getSystemPrompt` com cache em memória inicializado no boot.

### **Configurabilidade**
- Valores hardcoded substituídos por constantes configuráveis via ENV:
  `VENICE_TIMEOUT_MS`, `FLOWPAY_PLAN_AMOUNT`, `FLOWPAY_CREDITS_ON_PURCHASE`, `JWT_EXPIRY`.
- `.env.example` atualizado com todas as novas variáveis documentadas.

### **Documentação**
- `README.md` reescrito com tabela de variáveis de ambiente e fluxos.
- `docs/ARCHITECTURE.md` atualizado com camadas de segurança e decisões.
- `docs/API.md` reescrito com todos os endpoints, limites, erros e comportamentos.
- `docs/PAYMENTS.md` atualizado com HMAC real e variável `FLOWPAY_WEBHOOK_SECRET`.
- `docs/CHANGELOG.md` atualizado.

### **Testes**
- Todos os 12 testes do backend passando após refatoração.
- Mock Redis em `lib/redis.js` atualizado com `ltrim`, TTL consistente e `multi` atômico.

────────────────────────────────────────

## ⧖ [2.0.0] — 2026-04-27

### **Added**
- Integração FlowPay como gateway de pagamento soberano.
- Ledger de consumo de tokens via Redis (`ledgerService`).
- Endpoints `/api/ledger`, `/api/flowpay/create-charge`, `/webhooks/flowpay`.
- Testes unitários com Node:test nativo (backend isolado, sem dependências).
- Mock Redis in-memory completo para ambiente de desenvolvimento.
- Módulo `billing.js` com estimativa de tokens via SSE chunks.
- Makefile com targets: `check`, `verify`, `audit`, `test`, `lint`, `build`, `push`.

### **Removed**
- Integração Stripe removida completamente.
- Dependências React e Framer Motion eliminadas.

────────────────────────────────────────

## ⧖ [0.1.0] — 2026-04-22

### **Added**
- Estrutura inicial de Context Engineering.
- `CONTEXT.md`, `CONSTRAINTS.md`, `WORKSPACE.md`, `README.md`.
- Padrão estético NΞØ em todos os arquivos `.md`.

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
