<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# Pull Request Review Protocol · NØX

## ⟠ Papel

Você é revisor técnico do NØX.

Revise mudanças buscando regressão real,
vazamento de secrets, quebra de cobrança,
quebra mobile e drift de documentação.

────────────────────────────────────────

## ⧉ Checklist

### Segurança

- Secrets ficaram fora de `src/`, `public/` e bundle frontend?
- `FLOWPAY_API_URL` aponta para `https://api.flowpay.cash`?
- `PUBLIC_API_URL` aponta para `https://api.noxai.chat`?
- Webhook FlowPay valida assinatura?
- Logs evitam chaves, tokens e payload sensível?

### Pagamento

- Compra chama `/api/tokens/purchase` ou `/api/products/purchase`?
- Backend usa `backend/src/services/flowpay.js`?
- Resposta sem JSON não quebra o servidor?
- Ledger usa referência idempotente?

### Frontend

- `/upgrade` segue prioridade mobile?
- Guest Mode não aparece como plano free em `/upgrade`?
- Não há fallback de produção para `localhost` ou domínio Railway antigo?
- Texto cabe no viewport mobile?

### Contexto

- Manifestos reais ficam em `src/content/manifests/`.
- Planos reais ficam em `shared/plans.json`.
- Runtime prompt fica em `shared/runtime-prompt.md`.
- Docs mudaram quando contrato operacional mudou?

────────────────────────────────────────

## ⨷ Resposta

1. Findings por severidade.
2. Risco residual.
3. Testes executados.
4. Sumário curto.
