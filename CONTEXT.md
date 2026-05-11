<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# Context

```text
========================================
          NØX · PROJECT CONTEXT
========================================
Status: active
Updated: 2026-05-11 (Auth Sync + Railway pnpm)
========================================
```

## ⟠ Produto

NØX é um protocolo de interface soberana para acesso a LLM, operando como o terminal central do ecossistema. Inclui ledger de uso atômico, pacotes pagos e integração profunda com FlowPay via Nexus.

Manifesto ativo: `src/content/manifests/nox.md`.
P.R.Ø é camada comercial/entitlement em `shared/plans.json`; não assumir manifesto separado sem arquivo real em `src/content/manifests/`.

────────────────────────────────────────

## ⧉ Stack

```text
Repo      Gitea (https://gitea.com/noxia/changeman.git)
Frontend  Astro 6 SSR + @astrojs/node
Backend   Express + Redis + Postgres
LLM       Venice (Uncensored)
Payment   FlowPay via api.flowpay.cash
Events    Nexus webhook (HMAC-SHA256)
Email     Resend
Deploy    Railway + Cloudflare
```

Auth por senha/magic-link usa Postgres. Contas via Magic Link nascem sem senha (`password_hash` NULL).
JWT segue o padrão de **Identidade Pura** (contém apenas o `userId`). O backend resolve o tier dinamicamente via Postgres em cada request.
O cookie `nox_token` sincroniza SSR e cliente, mas token guest não deve sobrepor token identificado válido em `localStorage`.
`/api/usage` é a fonte de verdade para conta, saldo, entitlement, `name` e `email`.

Redis: cache operacional, quota de guests e contagem de mensagens (race-safe).
Ledger (Postgres + Redis fallback): fonte de verdade de saldo para usuários identificados. **LEDGER-FIRST.**
Todos os novos usuários ganham um `welcome_bonus` de 1000 tokens no ato do registro.

### Regra LEDGER-FIRST

```text
Fluxo: User → API → Ledger.getBalance() → Venice → Ledger.addEntry(CONSUMPTION)

paid_basic / paid_pro  → autorização via saldo do ledger  → saldo ≤0 retorna HTTP 402
guest / free           → quota acumulada por consumo (limite do plano)
Venice falhar          → não debita
Webhook duplicado      → ON CONFLICT(reference) → não duplica crédito
```

────────────────────────────────────────

## ⨷ Fronteiras

```text
noxai.chat           -> app NØX
api.noxai.chat       -> backend NØX
api.flowpay.cash     -> FlowPay (serviço próprio, Cloudflare Worker)
nexus.neoprotocol.space -> Nexus (hub de eventos, Railway)
gitea.com/noxia      -> repositório soberano
```

`FLOWPAY_API_URL` nunca aponta para `api.noxai.chat`.

`FLOWPAY_API_KEY` no Railway (backend NØX) deve ser idêntica a `FLOWPAY_INTERNAL_API_KEY` do Cloudflare Worker `flowpay-api`. O FlowPay valida via `x-api-key === FLOWPAY_INTERNAL_API_KEY` — qualquer divergência retorna 401 → 502.

────────────────────────────────────────

## ⧖ Rotas

- `/`: terminal principal (NØX Core / P.R.Ø).
- `/login`: login e magic link.
- `/signup`: criação de conta.
- `/auth/magic-link`: consumo do token de e-mail.
- `/pricing`: vitrine pública de preços.
- `/upgrade`: pacotes pagos e produto P.R.Ø.
- `/account`: conta, uso, nome e e-mail.
- `/success`: retorno pós-pagamento (Privilégios Elevados).
- `/privacy`: política de privacidade.
- `/terms`: termos.

────────────────────────────────────────

## ⍟ Planos

Fonte de verdade: `shared/plans.json`.

Tiers atuais:
- `guest`: Ghost Access (limites estritos).
- `free`: Citizen (usuário identificado, 1k tokens welcome bonus).
- `paid_basic`: Operator (acesso prioritário, créditos NEØ / VOID).
- `paid_pro`: EL CHAPO 亗 (acesso total e personas avançadas).

Usuários identificados (`free`, `paid_basic`, `paid_pro`) são autorizados via saldo real no `ledgerService.getBalance()`.
Sessões `guest` usam o sistema de quota acumulada (consumo vs. limite do plano) persistido em Redis por IP.
