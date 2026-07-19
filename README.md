<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# NØX

![neo-chat-uncensored banner](./public/neo-chat-uncensored-banner.svg)

```text
========================================
          NØX · AI
========================================
Status: production
Runtime: Astro SSR + Express API
Domains: noxai.chat / api.noxai.chat
========================================
```

> **Version:** v4.2.0
> **Status:** active
> **Protocol:** NØX / FlowPay / Venice

```text
▓▓▓ RAILWAY PRODUCTION SHAPE
────────────────────────────────────────

Frontend NØX
  noxai.chat
  │
  │ PUBLIC_API_URL=https://api.noxai.chat
  ▼
Nginx WAF Shield (nginx-WAF)
  api.noxai.chat [Porta 3000]
  │
  │ proxy_pass http://backend.railway.internal:3001
  ▼
Backend NØX
  backend.railway.internal [Porta 3001]
  │
  ├─ Postgres HA
  │  users, payments, ledger, magic links
  │
  ├─ Redis
  │  quota, cache, reset password, idempotência
  │
  ├─ Venice API
  │  execução IA via backend proxy
  │
  ├─ FlowPay API
  │  https://api.flowpay.cash
  │
  └─ Resend API
     e-mail externo via RESEND_API_KEY
```

```text
▓▓▓ AUTH + CHAT + LEDGER
────────────────────────────────────────
```

```diagram
Usuário
  └─ Frontend Astro SSR
     └─ Backend Express
        ├─ Auth via Postgres HA
        ├─ Sessão JWT de identidade pura
        ├─ Quota/cache via Redis
        ├─ Venice para geração
        └─ Ledger para débito auditável
```

`Resend Mail` não é serviço Railway soberano do NØX.
Resend é provedor externo consumido pelo backend.

O runtime de chat ainda vive dentro do backend NØX,
mas é candidato natural a sair para um nó próprio
quando o protocolo separar chat,
orquestração e produto.

## ⟠ Arquitetura de Confiança

O NØX opera sob três pilares de integridade técnica:

1. **Pure Identity (JWT)**: Tokens de acesso contêm apenas a identidade (`userId`). A autorização de recursos e tiers é resolvida dinamicamente no Backend via Postgres HA, garantindo que mudanças de plano sejam refletidas instantaneamente em todos os dispositivos.
2. **Ledger Resilience**: Todo consumo de IA é processado em blocos `try/finally`. Tokens parciais são debitados mesmo em caso de interrupção de conexão ou erro de stream.
3. **Deterministic Billing**: Novos usuários recebem um `welcome_bonus` no Ledger, transformando a cota gratuita em créditos reais rastreáveis desde a primeira interação.

────────────────────────────────────────

## ⧉ Contrato Atual

```text
┏━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ CAMADA             ┃ CONTRATO
┣━━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ Frontend           ┃ Astro 6 SSR, adapter Node standalone
┃ Backend            ┃ Express API, Venice proxy, auth e ledger
┃ Domínio app        ┃ https://noxai.chat
┃ Domínio API        ┃ https://api.noxai.chat
┃ Pagamentos         ┃ FlowPay em https://api.flowpay.cash
┃ E-mail             ┃ Resend API externo
┃ Planos             ┃ shared/plans.json
┗━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Guest Mode continua existindo como degustação controlada.
Ele não é exibido como plano gratuito em `/upgrade`.

`/upgrade` mostra apenas pacotes pagos e produtos P.R.O.

────────────────────────────────────────

## ⨷ Componentes

- `src/pages/`: rotas Astro SSR.
- `src/components/AstroChatInterface.astro`: chat principal.
- `backend/src/server.js`: API Express, auth, chat, FlowPay e webhooks.
- `backend/src/services/ledger.js`: ledger de créditos e consumo.
- `backend/src/services/flowpay.js`: cliente seguro da API FlowPay.
- `backend/src/services/email.js`: envio HTTP via Resend (template dark on-brand + List-Unsubscribe em marketing).
- `backend/src/utils/unsubscribe.js`: token HMAC e URL de opt-out (`/api/unsubscribe`).
- `src/pages/health/deep.ts`: deep health check (frontend → backend via `BACKEND_URL`).
- `shared/plans.json`: fonte de verdade de planos, tokens e preços.
- `shared/runtime-prompt.md`: contrato mínimo injetado no runtime.

────────────────────────────────────────

## ⍟ Runtime Boundary

Arquivos operacionais para agentes de desenvolvimento:

- `AGENTS.md`
- `CONTEXT.md`
- `MEMORY.md`
- `SKILL.md`
- `SETUP.md`
- `USER_JOURNEY.md`
- `NEXTSTEPS.md`
- `docs/`
- `.github/prompts/*`

Esses arquivos não são prompt runtime do usuário final.
O runtime do chat usa apenas `shared/runtime-prompt.md`
e os manifestos autorizados em `src/content/manifests/`.

────────────────────────────────────────

## ◬ PNPM Compartilhado

Este repositório usa `pnpm`.
Há `pnpm-workspace.yaml` local e `pnpm-lock.yaml` versionado.
Overrides de dependências ficam em `pnpm-workspace.yaml`.
Stages Docker que rodam `pnpm install --frozen-lockfile`
devem copiar `pnpm-workspace.yaml` junto do lockfile.

Não trocar para `npm` ou `yarn`.
Não duplicar dependências fora do contrato do workspace.

────────────────────────────────────────

## ⧖ Comandos

```bash
make install
make dev
make check
make build
```

```bash
fnm exec --using v25.9.0 pnpm check
fnm exec --using v25.9.0 pnpm build
fnm exec --using v25.9.0 pnpm --filter chat-api-backend test
```

────────────────────────────────────────

## ◮ Deploy

Frontend Railway:

```text
Service: FRONTEND
Start: node dist/server/entry.mjs
Health: /health  (raso, Railway)
Health deep: /health/deep  (valida backend via BACKEND_URL na rede privada)
PUBLIC_API_URL=https://api.noxai.chat
BACKEND_URL=http://backend.railway.internal:PORT  (rede privada, só server-side)
Docker runtime copia package.json, pnpm-lock.yaml e pnpm-workspace.yaml antes do install.
```

Backend Railway:

```text
Service: backend
Start: node src/server.js
Health: /health
Unsubscribe: /api/unsubscribe  (List-Unsubscribe one-click / opt-out de marketing)
FRONTEND_URL=https://noxai.chat
FLOWPAY_API_URL=https://api.flowpay.cash
RESEND_FROM_EMAIL=NØX <send@noxai.chat>
```

`FLOWPAY_API_URL` nunca deve apontar para `api.noxai.chat`.
Esse domínio é da API NØX, não do provedor FlowPay.

────────────────────────────────────────

## ⧇ Documentação

- [Setup](./SETUP.md)
- [Jornada do usuário](./USER_JOURNEY.md)
- [Próximos passos](./NEXTSTEPS.md)
- [Topologia de deploy](./docs/DEPLOY_TOPOLOGY.md)
- [Contrato de rotas](./docs/ROUTE_CONTRACT.md)
- [Contrato de envs](./docs/ENV_CONTRACT.md)
- [Markdown Style Guide](./docs/MARKDOWN_STYLE_GUIDE.md)

```text
▓▓▓ NØX AI
────────────────────────────────────────
O sistema não te protege, quebre ele.
@noxaioficial on Telegram
site oficial <https://noxai.chat>
────────────────────────────────────────
```
