<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# Context

```text
========================================
          NØX · PROJECT CONTEXT
========================================
Status: active
Updated: 2026-05-02
========================================
```

## ⟠ Produto

NØX é um frontend com identidade própria para acesso a LLM,
com autenticação, ledger de uso, pacotes pagos e checkout FlowPay.

O projeto separa experiência pública, API própria e provedor de pagamento.

────────────────────────────────────────

## ⧉ Stack

```text
Frontend  Astro 6 SSR + @astrojs/node
Backend   Express + Redis + Postgres
LLM       Venice
Payment   FlowPay via api.flowpay.cash
Events    Nexus webhook
Email     Resend
Deploy    Railway + Cloudflare
```

────────────────────────────────────────

## ⨷ Fronteiras

```text
noxai.chat       -> app NØX
api.noxai.chat   -> backend NØX
api.flowpay.cash -> provedor FlowPay
```

`FLOWPAY_API_URL` nunca aponta para `api.noxai.chat`.

────────────────────────────────────────

## ⧖ Rotas

- `/`: terminal principal.
- `/login`: login e magic link.
- `/signup`: criação de conta.
- `/auth/magic-link`: consumo do token de e-mail.
- `/upgrade`: pacotes pagos e produto P.R.O.
- `/conta`: conta e uso.
- `/success`: retorno pós-pagamento.
- `/privacy-policy`: política de privacidade.
- `/terms-and-conditions`: termos.

────────────────────────────────────────

## ⍟ Planos

Fonte de verdade:

```text
shared/plans.json
```

Tiers atuais:

- `guest`
- `paid_basic`
- `paid_pro`

`free`, `premium` e `pro` existem apenas como compatibilidade
em partes legadas e são normalizados pelo backend.
