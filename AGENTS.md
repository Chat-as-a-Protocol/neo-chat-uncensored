<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# Agents

```text
========================================
          NØX · AGENT PROTOCOL
========================================
Scope: neo-chat-uncensored
Status: active
========================================
```

## ⟠ Papel

Atuar como copiloto técnico do NØX.

Prioridade:

```text
segurança > estabilidade > legibilidade > performance > estética
```

────────────────────────────────────────

## ⧉ Realidade Atual

- Marca pública: `NØX`.
- Domínio app: `https://noxai.chat`.
- Domínio API: `https://api.noxai.chat`.
- FlowPay externo: `https://api.flowpay.cash`.
- E-mail: `NØX <send@noxai.chat>`.
- Frontend: Astro SSR, não estático puro.
- Backend: Express em `backend/src/server.js`.
- Planos: `shared/plans.json`.
- Runtime prompt: `shared/runtime-prompt.md`.
- Repo: `https://gitea.com/noxia/changeman.git`.
- Webhook: `POST /api/webhooks/flowpay` (Hardened).
- PWA: `v4` (Cache resiliente).
- FlowPay: PIX em produção validado (2026-05-06). `FLOWPAY_API_KEY` no Railway configurada e funcionando.

────────────────────────────────────────

## ⨷ Regras

- Não inventar rotas, arquivos, dependências ou contexto.
- Não tocar em `.env` real.
- Não expor secrets, tokens ou chaves.
- Usar `pnpm`, não `npm` ou `yarn`.
- Preservar arquitetura existente antes de sugerir rewrite.
- Aplicar a menor alteração funcional possível.
- Atualizar docs quando a mudança alterar contrato operacional.
- Tratar `FLOWPAY_API_URL` e `PUBLIC_API_URL` como coisas diferentes.
- **CORS**: **PROIBIDO** usar pacotes externos (`cors`). Usar injeção manual de headers no topo do `server.js` permitindo `includes("noxai.chat")`.
- **PWA**: Incrementar `CACHE_NAME` em `sw.js` após qualquer mudança em assets estáticos.
- **Webhooks**: Validar HMAC-SHA256 e suportar headers `X-Nexus-Signature` e `X-FlowPay-Signature`.

────────────────────────────────────────

## ⧖ Validação

Para mudanças de frontend:

```bash
fnm exec --using v25.9.0 pnpm check
fnm exec --using v25.9.0 pnpm build
```

Para mudanças de backend:

```bash
node --check backend/src/server.js
fnm exec --using v25.9.0 pnpm --filter chat-api-backend test
```

Para documentação:

```bash
rg -n "<termo-obsoleto>" README.md SETUP.md USER_JOURNEY.md NEXTSTEPS.md docs .github/prompts
git diff --check
```

────────────────────────────────────────

## ⍟ Saída Esperada

Toda entrega deve informar:

1. causa provável
2. arquivos afetados
3. patch aplicado
4. comandos executados
5. risco residual
