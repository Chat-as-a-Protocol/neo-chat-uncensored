<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# Memory

```text
========================================
          NØX · TECHNICAL MEMORY
========================================
Status: active
Updated: 2026-05-02
========================================
```

## ⟠ Decisões

- Nome público de marketing: `NØX`, sem sufixo de produto.
- `noxai.chat` é o domínio do app.
- `api.noxai.chat` é o domínio da API própria.
- `api.flowpay.cash` é o domínio do FlowPay.
- `send@noxai.chat` é o remetente atual via Resend.
- Guest Mode existe, mas não aparece como plano em `/upgrade`.
- `/upgrade` é mobile-first e deve evitar efeitos pesados de desktop.
- `shared/plans.json` é a base única de planos.

────────────────────────────────────────

## ⧉ Incidentes Resolvidos

### FlowPay HTML

Sintoma:

```text
Unexpected token '<', "<!doctype"... is not valid JSON
```

Causa:
backend esperava JSON do FlowPay,
mas recebeu HTML por URL ou resposta upstream inválida.

Correção:
`backend/src/services/flowpay.js` centraliza a chamada,
valida JSON, exige `checkoutUrl` e rejeita self-call.

────────────────────────────────────────

## ⨷ Regras Práticas

- Não colocar secrets no frontend.
- Não usar `api.noxai.chat` como `FLOWPAY_API_URL`.
- Não usar `serve dist`; frontend é Astro SSR.
- Não recriar plano free em `/upgrade`.
- Atualizar docs junto com mudança de contrato.
