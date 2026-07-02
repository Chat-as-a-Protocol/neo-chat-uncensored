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

READ-ONLY MODE ATIVO

Sem autorização explícita com:
AUTORIZO APLICAR PATCH

Você não pode alterar nada.

Apenas:
- analisar
- sugerir
- gerar diff

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
│   └── schema.sql          PostgreSQL
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

```text
▓▓▓ RAILWAY ATUAL
────────────────────────────────────────

┏ FRONTEND
├─ Domínio
│  https://noxai.chat
├─ Health
│  GET /health
└─ Chama
   https://api.noxai.chat

┏ backend
├─ Domínio
│  https://api.noxai.chat
├─ Health
│  GET /health
├─ Usa
│  PostgreSQL
│  Redis
├─ Chama
│  Venice API
│  FlowPay API
│  Resend API
└─ Recebe
   FlowPay/Nexus webhooks
```

`Resend Mail`, quando existir no Railway como starter,
não é parte obrigatória do deploy NØX.

O backend envia e-mails diretamente via Resend API.
Só manter um serviço próprio de mail se ele possuir código
e contrato soberano reais.

Contrato visual detalhado:
`docs/DEPLOY_TOPOLOGY.md`.

────────────────────────────────────────

## ◯ Fluxo Auth + Chat + Venice + Ledger

Usuário
  │
  ├─ 1) Auth
  │     POST /api/auth/signup|login
  │     → valida credenciais
  │     → (signup) cria user e bônus inicial no ledger
  │     → emite JWT
  ▼
Backend NØX (Express)
  │
  ├─ 2) Chat
  │     POST /api/chat (Bearer JWT)
  │     → authenticateToken (JWT + Postgres)
  │     → rate limit por usuário (Redis)
  │     → checkQuota (plans.json + ledger)
  │     → monta prompt (runtime-prompt + persona)
  ▼
Venice API
  │
  ├─ 3) Resposta IA
  │     → stream SSE ou JSON
  │     → backend conta tokens (usage ou texto)
  ▼
Ledger (ledgerService)
  │
  ├─ 4) Débito
  │     → addEntry(userId, -tokens, TOKEN_CONSUMPTION)
  │     → se créditos insuficientes: 402
  │     → se ok: segue resposta da IA
  ▼
Usuário
  → recebe resposta com cobrança já aplicada no ledger

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

Proteção de chaves:

```bash
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore
echo "!.env.example" >> .gitignore
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

Contrato canônico de nomes e responsabilidades:
`docs/ENV_CONTRACT.md`.

Backend Railway:

```env
JWT_SECRET=...
VENICE_API_KEY=...
VENICE_MODEL=<venice-model-id>
# opcional: VENICE_API_BASE=https://api.venice.ai/api/v1
POSTGRES_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
FRONTEND_URL=https://noxai.chat
FLOWPAY_API_URL=https://api.flowpay.cash
FLOWPAY_API_KEY=...   # deve ser idêntica a FLOWPAY_INTERNAL_API_KEY do Cloudflare Worker flowpay-api
FLOWPAY_WEBHOOK_SECRET=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=NØX <send@noxai.chat>
MAGIC_LINK_EXPIRATION_MINUTES=10
```

`RESEND_API_KEY` é secret do backend.
Não depende de um serviço Railway chamado `Resend Mail`,
salvo se esse serviço for formalizado como nó de mail.

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
  `VENICE_API_KEY`, `VENICE_MODEL`, `POSTGRES_URL` e `REDIS_URL`
  ficam no backend.
- Webhooks validam assinatura `X-Nexus-Signature`.
- Ledger usa idempotência por referência de pagamento.
- FlowPay service rejeita resposta HTML e URL apontando
  para o próprio app.
- Resend é provider externo.
  E-mail não roda no frontend nem exige serviço Railway próprio.

────────────────────────────────────────

## ⧉ Testes Ponta-a-Ponta (Playwright)

Para garantir que o fluxo do usuário (login, chat, etc.) não quebre, usamos o Playwright para testes E2E.

### Instalação

Como o ambiente de desenvolvimento precisa baixar os navegadores do Playwright, você deve instalar as dependências e os binários na sua máquina local:

```bash
pnpm add -D @playwright/test -w
pnpm exec playwright install
```

### Como Rodar

Para rodar os testes simulando o usuário no navegador:

```bash
npx playwright test
```

Os testes ficam localizados na pasta `tests/`.

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
