<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# Context

```text
========================================
          NØX · PROJECT CONTEXT
========================================
Status: active
Updated: 2026-05-06
========================================
```

## ⟠ Produto

NØX é um protocolo de interface soberana para acesso a LLM, operando como o terminal central do ecossistema. Inclui ledger de uso atômico, pacotes pagos e integração profunda com FlowPay via Nexus.

Persona Principal: NØX (Autonomia e Quebra de Restrições).
Persona Avançada: P.R.Ø (Protocolo de Risco Otimizado).

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
Redis: cache operacional, quota de guests/free e contagem de mensagens (race-safe).
Ledger (Postgres + Redis fallback): fonte de verdade de saldo para usuários pagantes. **LEDGER-FIRST.**

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
noxai.chat       -> app NØX
api.noxai.chat   -> backend NØX
api.flowpay.cash -> provedor FlowPay
gitea.com/noxia  -> repositório soberano
```

`FLOWPAY_API_URL` nunca aponta para `api.noxai.chat`.

────────────────────────────────────────

## ⧖ Rotas

- `/`: terminal principal (NØX Core / P.R.Ø).
- `/login`: login e magic link.
- `/signup`: criação de conta.
- `/auth/magic-link`: consumo do token de e-mail.
- `/precos`: vitrine pública de preços.
- `/upgrade`: pacotes pagos e produto P.R.Ø.
- `/conta`: conta e uso.
- `/success`: retorno pós-pagamento (Privilégios Elevados).
- `/privacy-policy`: política de privacidade.
- `/terms-and-conditions`: termos.

────────────────────────────────────────

## ⍟ Planos

Fonte de verdade: `shared/plans.json`.

Tiers atuais:
- `guest`: Visitante (limites estritos).
- `paid_basic`: Usuário identificado (créditos NEØ / VOID).
- `paid_pro`: EL CHAPO / P.R.Ø (acesso total e personas avançadas).

O backend normaliza `free`, `premium` e `pro` para estes tiers canônicos.
Usuários pagantes (`paid_basic`, `paid_pro`) são autorizados via `ledgerService.getBalance()` — não pelo limite Redis do plano.
Guests e usuários free usam o sistema de quota acumulada (consumo vs. limite do plano).
