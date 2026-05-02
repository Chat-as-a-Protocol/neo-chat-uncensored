<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# Next Steps

```text
========================================
          NØX · EXECUTION BACKLOG
========================================
Status: active
Updated: 2026-05-02
========================================
```

## ⧉ Estado Atual

```text
┏━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ ÁREA               ┃ ESTADO
┣━━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ Frontend           ┃ Astro SSR em Railway
┃ Domínio app        ┃ https://noxai.chat
┃ Backend API        ┃ https://api.noxai.chat
┃ Pagamentos         ┃ FlowPay service + webhook Nexus
┃ E-mail             ┃ Resend via backend
┃ Planos             ┃ shared/plans.json
┃ Guest Mode         ┃ Controlado, não exibido em /upgrade
┗━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

────────────────────────────────────────

## ⟠ Concluído

- Astro SSR com `@astrojs/node`.
- Backend Express separado.
- Health checks em `/health`.
- CORS por `FRONTEND_URL`.
- `PUBLIC_API_URL=https://api.noxai.chat`.
- `FLOWPAY_API_URL=https://api.flowpay.cash`.
- Ledger por consumo e crédito.
- Pacotes `1k`, `5k`, `10k`.
- Produto `P.R.O Analyst`.
- Resend para magic link e confirmação.
- `/upgrade` mobile-first e sem card de Guest Mode.
- Service FlowPay com erro seguro para HTML/self-call.
- Testes unitários de ledger, billing, payments e FlowPay.

────────────────────────────────────────

## ⨷ Pendente Imediato

1. Validar compra real de pacote em produção.
2. Confirmar webhook FlowPay via Nexus em produção.
3. Verificar domínio Resend `send@noxai.chat`.
4. Conferir `FRONTEND_URL` e `PUBLIC_API_URL` no Railway.
5. Testar magic link em e-mail real.
6. Revisar `/conta` para statement de ledger.

────────────────────────────────────────

## ⧖ Dívida Técnica

- Consolidar helper único de resolução da URL pública da API.
- Atualizar comentários antigos de tier em `backend/schema.sql`.
- Separar helpers de URL pública do frontend em módulo único.
- Melhorar mensagens de erro no checkout sem revelar detalhes internos.

────────────────────────────────────────

## ⧗ Validação

Antes de push:

```bash
make check
make build
git diff --check
```

Backend isolado:

```bash
fnm exec --using v25.9.0 pnpm --filter chat-api-backend test
```

Smoke test produção:

```bash
curl -I https://noxai.chat/health
curl -I https://api.noxai.chat/health
```

────────────────────────────────────────

## ⍟ Regra de Operação

```text
PUBLIC_API_URL  -> API NØX
FLOWPAY_API_URL -> API FlowPay
```

Nunca apontar `FLOWPAY_API_URL` para `api.noxai.chat`.
