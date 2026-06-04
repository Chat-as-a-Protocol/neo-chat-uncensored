<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# Route Contract

```text
========================================
          NØX · ROUTE CONTRACT
========================================
Status: canonical
Scope: frontend Astro -> backend Express
========================================
```

## ⟠ Regra

Frontend não decide autoridade.

Toda rota pública ou autenticada do Astro deve apontar para um endpoint
backend explícito quando houver mutação, autenticação, cobrança, ledger,
quota ou consumo de IA.

```text
Frontend route -> Backend endpoint -> responsabilidade
```

────────────────────────────────────────

## ⧉ Contrato Canônico

| Frontend route | Backend endpoint | Responsabilidade |
|---|---|---|
| `/` | `POST /api/auth/guest` | Criar sessão guest controlada quando não existe token identificado válido. |
| `/` | `POST /api/chat` | Executar chat via backend, aplicar auth, rate limit, quota, prompt runtime, Venice e débito de ledger. |
| `/` | `GET /api/usage` | Sincronizar saldo, tier, limite, entitlement, nome e e-mail para barreiras de uso. |
| `/login` | `POST /api/auth/login` | Autenticar usuário por e-mail/senha e emitir JWT. |
| `/login` | `POST /api/auth/magic-link/request` | Criar usuário se necessário, emitir token de magic link e enviar e-mail via Resend. |
| `/signup` | `POST /api/auth/signup` | Criar usuário identificado, gerar senha, conceder welcome bonus no ledger e emitir JWT. |
| `/auth/magic-link` | `POST /api/auth/magic-link/verify` | Consumir token de magic link, marcar como usado e emitir JWT de usuário identificado. |
| `/auth/reset-password` | `POST /api/auth/password-reset/complete` | Consumir token de reset e gravar nova senha no Postgres. |
| `/account` | `GET /api/usage` | Exibir estado canônico da conta, saldo, tier, entitlement, nome e e-mail. |
| `/upgrade` | `POST /api/tokens/purchase` | Criar cobrança FlowPay para pacote de tokens configurado em `shared/plans.json`. |
| `/upgrade` | `POST /api/products/purchase` | Criar cobrança FlowPay para produto/tier P.R.O configurado em `shared/plans.json`. |
| `/upgrade` | `GET /api/flowpay/health` | Diagnóstico protegido da conectividade FlowPay, ativo somente com `ENABLE_FLOWPAY_DIAGNOSTICS=true`. |
| `/upgrade` | `POST /api/flowpay/test-charge` | Criar cobrança sandbox de diagnóstico, ativo somente com `ENABLE_FLOWPAY_DIAGNOSTICS=true`. |
| `/success` | `GET /api/usage` | Confirmar estado pós-pagamento pela fonte canônica do backend. |
| `/pricing` | Nenhum endpoint obrigatório | Vitrine pública; não decide entitlement nem preço final. |
| `/privacy` | Nenhum endpoint obrigatório | Documento legal público. |
| `/terms` | Nenhum endpoint obrigatório | Documento legal público. |
| `/health` | `GET /health` | Health check SSR do frontend; backend também expõe `GET /health` no domínio API. |

────────────────────────────────────────

## ⨷ Endpoints Backend Sem Rota Frontend Primária

| Backend endpoint | Consumidor | Responsabilidade |
|---|---|---|
| `POST /api/auth/password-reset/request` | Fluxo futuro de esqueci minha senha ou chamada manual da UI | Gerar token de reset e enviar e-mail sem revelar existência da conta. |
| `GET /api/models` | UI futura/admin/debug autenticado | Listar modelos Venice disponíveis e modelo padrão do backend. |
| `GET /api/ledger` | UI futura de extrato | Retornar statement e saldo do ledger do usuário autenticado. |
| `POST /api/flowpay/create-charge` | Checkout legado condicionado por flag | Criar cobrança do pacote `40k` apenas com `ENABLE_PRO_ENGINE_CHECKOUT=true`. |
| `POST /api/webhooks/flowpay` | Nexus / FlowPay | Processar webhook assinado, aplicar idempotência, atualizar pagamento, ledger e tier. |
| `POST /webhooks/flowpay` | Nexus / FlowPay | Alias operacional do webhook FlowPay. |

────────────────────────────────────────

## ⍟ Autoridades

| Responsabilidade | Autoridade |
|---|---|
| Identidade | Backend + Postgres |
| Sessão | Backend emite JWT; frontend apenas armazena e envia. |
| Tier e entitlement | Backend resolve via Postgres, Redis e `shared/plans.json`. |
| Saldo | Ledger backend. |
| Quota | Backend via `checkQuota`, Redis e ledger. |
| Cobrança | Backend cria FlowPay charge; frontend nunca fala direto com FlowPay. |
| Confirmação de pagamento | Webhook assinado FlowPay/Nexus. |
| E-mail | Backend via Resend. |
| IA | Backend proxy para Venice; frontend não chama Venice. |

────────────────────────────────────────

## ⧖ Smoke Test de Release

```bash
pnpm --filter neo-chat-uncensored-frontend check
pnpm --filter chat-api-backend test
pnpm --filter neo-chat-uncensored-frontend build
```

Smoke manual mínimo após deploy:

```text
/health
/login -> POST /api/auth/login
/signup -> POST /api/auth/signup
/ -> POST /api/auth/guest -> POST /api/chat -> GET /api/usage
/upgrade -> POST /api/tokens/purchase
/auth/magic-link -> POST /api/auth/magic-link/verify
/account -> GET /api/usage
FlowPay/Nexus -> POST /api/webhooks/flowpay
```
