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

```diagram
1. Usuário (Browser / App)
   - Interage via UI Astro SSR em https://noxai.chat
   - Envia credenciais e mensagens de chat

2. Frontend (Astro SSR)
   - Roteia:
     - /login, /signup, /chat, /upgrade
   - Chama a API pública NØX:
     - POST https://api.noxai.chat/api/auth/...
     - POST https://api.noxai.chat/api/chat

3. Backend NØX (Express API)
   - Auth:
     - Valida login/signup
     - Cria usuário (Postgres)
     - Gera JWT (identidade pura: userId)
     - Concede welcome_bonus no ledger
   - Chat:
     - authenticateToken (JWT + Postgres)
     - Rate limiting por usuário (Redis)
     - checkQuota (plans.json + ledger)
     - Monta prompt (runtime-prompt + persona)
     - Proxy Venice: /chat/completions
     - Conta tokens da resposta e debita ledger

4. Venice API (IA)
   - Recebe:
     - model: VENICE_MODEL
     - messages (prompt + conversa)
   - Responde:
     - streaming (SSE) ou JSON
   - Não guarda estado de billing: só gera tokens

5. Ledger (backend/src/services/ledger.js)
   - Registra:
     - TOKEN_PURCHASE (bônus, recargas, FlowPay)
     - TOKEN_CONSUMPTION (chat, IA)
     - PRO_SUBSCRIPTION (eventos de assinatura)
   - Garante:
     - idempotência por referência
     - saldo auditável por usuário

Fluxo resumido:

Usuário → Frontend → Backend Auth → Postgres + Ledger (bônus)
Usuário + JWT → Frontend → Backend Chat → Venice → Ledger (débito) → Usuário
```

## ⟠ Arquitetura de Confiança

O NØX opera sob três pilares de integridade técnica:

1. **Pure Identity (JWT)**: Tokens de acesso contêm apenas a identidade (`userId`). A autorização de recursos e tiers é resolvida dinamicamente no Backend via PostgreSQL, garantindo que mudanças de plano sejam refletidas instantaneamente em todos os dispositivos.
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
┃ E-mail             ┃ Resend, NØX <send@noxai.chat>
┃ Planos             ┃ shared/plans.json
┗━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Guest Mode continua existindo como degustação controlada.
Ele não é exibido como plano gratuito em `/upgrade`.

`/upgrade` mostra apenas pacotes pagos e produtos P.R.O.

────────────────────────────────────────

## ⨷ Componentes

- `src/pages/`: rotas Astro SSR.
- `src/components/AstroChatInterface.astro`: terminal principal.
- `backend/src/server.js`: API Express, auth, chat, FlowPay e webhooks.
- `backend/src/services/ledger.js`: ledger de créditos e consumo.
- `backend/src/services/flowpay.js`: cliente seguro da API FlowPay.
- `backend/src/services/email.js`: envio HTTP via Resend.
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
Start: node dist/server/entry.mjs
Health: /health
PUBLIC_API_URL=https://api.noxai.chat
Docker runtime copia package.json, pnpm-lock.yaml e pnpm-workspace.yaml antes do install.
```

Backend Railway:

```text
Start: node src/server.js
Health: /health
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
- [Markdown Style Guide](./docs/MARKDOWN_STYLE_GUIDE.md)

```text
▓▓▓ NØX AI
────────────────────────────────────────
Segurança ofensiva desenfreada. O sistema não te protege, quebre ele.
@noxaioficial on Telegram
site oficial <https://noxai.chat>
────────────────────────────────────────
```
