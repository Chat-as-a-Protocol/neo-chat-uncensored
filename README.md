# NØX.ai · neo-chat-uncensored

```text
========================================
     NØX.ai · PROCESSING ENGINE
========================================
Version  : v2.1.0
Status   : Operational
Framework: Astro 6.x · Node 22+ · Express
Protocol : NΞØ Nexus / FlowPay (No Stripe)
========================================
```

![neo-chat-uncensored banner](./public/neo-chat-uncensored-banner.svg)

> **Stack:** Astro 6 · Express · Redis · Venice AI · FlowPay  
> **Auth:** JWT (bcrypt + SHA-256 userId)  
> **Pagamentos:** FlowPay via Nexus (HMAC-SHA256 validado)  
> **Testes:** Node:test nativo · 12/12 passando

## ⟠ Objetivo

Interface soberana e minimalista para processamento de IA sem censura.
Arquitetura monorepo com frontend Astro 6 (static) e backend Express isolado.
Streaming SSE nativo, ledger soberano de consumo e pagamentos via FlowPay.

────────────────────────────────────────

## ⧉ Arquitetura

```text
▓▓▓ SYSTEM TOPOLOGY
────────────────────────────────────────
Root (pnpm workspace)
├─ Frontend (Astro 6 · static output)
│   ├─ src/pages/            → Rotas estáticas (chat, login, upgrade...)
│   ├─ src/components/       → AstroChatInterface, etc.
│   └─ public/               → Assets e SVG banners
│
└─ Backend (Express · Node 22+)
    ├─ src/server.js          → Core API
    ├─ src/lib/redis.js       → Redis real (prod) ou mock in-memory (dev)
    ├─ src/services/ledger.js → Ledger soberano de tokens
    └─ src/utils/billing.js   → Estimativa de consumo SSE
────────────────────────────────────────
```

### Fluxo de dados

```text
1. Usuário → POST /api/chat (JWT Bearer)
2. authenticateToken → createUserRateLimit → checkQuota
3. Backend proxia Venice AI com AbortController (timeout 30s)
4. Stream SSE pipe → cliente em tempo real
5. ledgerService.addEntry (assíncrono, não bloqueia resposta)
```

### Fluxo de pagamento

```text
1. Usuário → POST /api/flowpay/create-charge
2. Backend → FlowPay API → retorna checkoutUrl
3. Usuário completa pagamento em flowpay.cash
4. FlowPay → Nexus → POST /webhooks/flowpay (X-Nexus-Signature)
5. Backend: HMAC-SHA256 timingSafeEqual → tier:userId = "pro" + 100k créditos
```

────────────────────────────────────────

## ⨷ Comandos (Makefile)

```bash
make install   # Instala todas as dependências (pnpm workspaces)
make dev       # Inicia FE (Astro :4321) + BE (Express :3001) simultaneamente
make dev-fe    # Apenas o frontend
make dev-be    # Apenas o backend
make check     # Gate completo: verify + audit + test + lint
make build     # Build de produção (Astro static)
make clean     # Remove dist/, .astro/ e node_modules/
make push      # Secure Gate: check + build + git status
```

────────────────────────────────────────

## ⍟ Segurança

- **HMAC-SHA256 obrigatório** em webhooks FlowPay com `timingSafeEqual`
- **SHA-256 unidirecional** para geração de userId (sem reversibilidade)
- **Timing-safe login** — bcrypt sempre executado (previne user enumeration)
- **Zod validation** em todas as rotas com schemas definidos no módulo
- **JSON body limit** de 64kb (anti-DoS)
- **CORS validado** por origem — sem wildcard em produção
- **CSP headers** via helmet com whitelist da Venice AI
- **Ledger ltrim** — máx. 1000 entradas/usuário (anti-memory leak)
- **Graceful shutdown** — SIGTERM/SIGINT tratados com fechamento ordenado

────────────────────────────────────────

## ◬ Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

| Variável | Descrição | Obrigatória em Prod |
|---|---|---|
| `VENICE_API_KEY` | Chave Venice AI | ✅ |
| `JWT_SECRET` | Secret de assinatura JWT | ✅ |
| `FRONTEND_URL` | URL do frontend (CORS) | ✅ |
| `FLOWPAY_API_KEY` | Chave FlowPay | ✅ |
| `FLOWPAY_WEBHOOK_SECRET` | Secret HMAC dos webhooks | ✅ |
| `REDIS_URL` | URL Redis (Railway auto-injeta) | ✅ |
| `VENICE_MODEL` | Modelo padrão Venice | ➖ |
| `VENICE_TIMEOUT_MS` | Timeout Venice (padrão: 30000) | ➖ |
| `FLOWPAY_PLAN_AMOUNT` | Valor BRL do PRO (padrão: 49) | ➖ |
| `PORT` | Porta do backend (padrão: 3001) | ➖ |

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
