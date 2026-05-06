<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# Setup

```text
========================================
          NØX · TECHNICAL SETUP
========================================
Status: active
Runtime: Astro SSR + Express
========================================
```

## ⟠ Objetivo

Documento operacional para rodar, validar e publicar NØX.

Ele descreve a realidade atual do projeto:
frontend Astro SSR, backend Express, API pública própria,
FlowPay externo, Resend e ledger auditável.

────────────────────────────────────────

## ⧉ Topologia

```text
neo-chat-uncensored/
├── src/                    Astro SSR app
├── public/                 assets públicos e PWA
├── backend/
│   ├── src/server.js       API Express
│   ├── src/services/       ledger, FlowPay, e-mail, pagamentos
│   └── schema.sql          Postgres
├── shared/
│   ├── plans.json          planos, limites, tokens e preços
│   └── runtime-prompt.md   prompt runtime mínimo
├── docs/                   standards para documentação
└── .github/prompts/        prompts de colaboração
```

```text
┏━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ Serviço      ┃ URL canônica
┣━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ Frontend     ┃ https://noxai.chat
┃ Backend API  ┃ https://api.noxai.chat
┃ FlowPay API  ┃ https://api.flowpay.cash
┃ Resend From  ┃ NØX <send@noxai.chat>
┗━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

────────────────────────────────────────

## ⨷ Comandos

Use `pnpm` via `Makefile`.

```bash
make install
make dev
make check
make build
```

Comandos diretos úteis:

```bash
fnm exec --using v25.9.0 pnpm check
fnm exec --using v25.9.0 pnpm build
fnm exec --using v25.9.0 pnpm --filter chat-api-backend test
```

────────────────────────────────────────

## ⧖ Frontend

Astro roda em modo SSR:

```text
output: server
adapter: @astrojs/node
start: node dist/server/entry.mjs
health: /health
```

Não usar `serve dist`.
O build não é host estático puro.

Variável pública principal:

```env
PUBLIC_API_URL=https://api.noxai.chat
```

────────────────────────────────────────

## ⧗ Backend

Backend Express:

```text
start: node src/server.js
health: /health
port: $PORT ou 3001
```

Responsabilidades:

- autenticação por senha e magic link
- proxy Venice
- quota e ledger
- checkout FlowPay
- webhook FlowPay via Nexus
- e-mails via Resend

────────────────────────────────────────

## ⍟ Variáveis

Backend Railway:

```env
JWT_SECRET=...
VENICE_API_KEY=...
VENICE_MODEL=<venice-model-id>
# opcional: VENICE_API_BASE=https://api.venice.ai/api/v1
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
FRONTEND_URL=https://noxai.chat
FLOWPAY_API_URL=https://api.flowpay.cash
FLOWPAY_API_KEY=...   # deve ser idêntica a FLOWPAY_INTERNAL_API_KEY do Cloudflare Worker flowpay-api
FLOWPAY_WEBHOOK_SECRET=...
RESEND_API_KEY=${{Resend Mail.RESEND_API_KEY}}
RESEND_FROM_EMAIL=NØX <send@noxai.chat>
MAGIC_LINK_EXPIRATION_MINUTES=10
```

Frontend Railway:

```env
PUBLIC_API_URL=https://api.noxai.chat
ENABLE_AUTH_PAGES=true
ENABLE_LANDING_PAGE=true
```

Regra crítica:

```text
FLOWPAY_API_URL != PUBLIC_API_URL
```

`FLOWPAY_API_URL` aponta para FlowPay.
`PUBLIC_API_URL` aponta para a API pública NØX.

────────────────────────────────────────

## ◬ Planos

Fonte de verdade:

```text
shared/plans.json
```

Tiers atuais:

- `guest`: degustação controlada, 3 mensagens e resposta compacta.
- `paid_basic`: usuário identificado com pacote de tokens.
- `paid_pro`: EL CHAPO / P.R.O com respostas maiores.

Compatibilidade interna:
`free`, `premium` e `pro` podem aparecer em fluxos legados,
mas são normalizados antes de aplicar regra de acesso.

────────────────────────────────────────

## ⧇ Segurança

- Secrets nunca entram no frontend.
- `RESEND_API_KEY`, `FLOWPAY_API_KEY`, `JWT_SECRET`,
  `VENICE_API_KEY`, `VENICE_MODEL`, `DATABASE_URL` e `REDIS_URL`
  ficam no backend.
- Webhooks validam assinatura `X-Nexus-Signature`.
- Ledger usa idempotência por referência de pagamento.
- FlowPay service rejeita resposta HTML e URL apontando
  para o próprio app.

────────────────────────────────────────

## ◮ Validação

Antes de publicar:

```bash
make check
make build
git diff --check
```

Smoke test pós-deploy:

```bash
curl -I https://noxai.chat/health
curl -I https://api.noxai.chat/health
```

Testes manuais:

- abrir `/login`
- pedir magic link
- abrir `/upgrade`
- iniciar compra de pacote → QR PIX deve ser exibido
- confirmar que o checkout vem do FlowPay (chargeId, brCode, status: ACTIVE)
- confirmar que nada chama `localhost`
- após pagamento real: confirmar webhook Nexus → crédito no ledger
