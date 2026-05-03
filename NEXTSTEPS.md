<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# Next Steps

```text
========================================
          NØX · EXECUTION BACKLOG
========================================
Status: release candidate
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
┃ Preços             ┃ /precos público, /upgrade identificado
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
- `/precos` público para descoberta comercial sem login.

────────────────────────────────────────

## ⨷ Pendente Imediato

1. Conferir variáveis do backend no Railway:
   `JWT_SECRET`, `VENICE_API_KEY`, `VENICE_MODEL`, `FRONTEND_URL`,
   `FLOWPAY_API_URL`, `FLOWPAY_API_KEY`, `FLOWPAY_WEBHOOK_SECRET`,
   `DATABASE_URL`, `REDIS_URL`, `RESEND_API_KEY` e `RESEND_FROM_EMAIL`.
2. Fazer smoke test pós-deploy:
   signup, login, guest chat, `/api/usage`, magic link e `/conta`.
3. Validar compra real de pacote em produção.
4. Confirmar webhook FlowPay via Nexus em produção.
5. Verificar domínio Resend `send@noxai.chat`.

────────────────────────────────────────

## ⧗ Security Release TODO

Aplicado:

- [x] Remover instruções de abuso do runtime prompt.
- [x] Remover instruções de abuso dos manifests `nox` e `analyst`.
- [x] Consolidar `/api/auth/login` e `/api/auth/signup` em handlers protegidos por rate limit e Zod.
- [x] Manter Postgres como fonte canônica de usuários identificados.
- [x] Corrigir streaming UTF-8 com `TextDecoder` persistente e `{ stream: true }`.
- [x] Tornar limite de mensagens atômico com `INCR` antes da checagem e `DECR` em bloqueio.
- [x] Adicionar `try/catch` e rate limit em `/api/usage`.
- [x] Evitar log em arquivo no container de produção.
- [x] Remover `allModelDetails` da resposta pública de `/api/models`.
- [x] Adicionar `Secure` ao cookie de auth quando o app roda em HTTPS.
- [x] Declarar `IS_REAL_REDIS` explicitamente.
- [x] Deduplicar `parsePositiveInt`.
- [x] Configurar limites explícitos no pool Postgres.

Fechado para release:

- [x] Smoke test manual depende do ambiente publicado e fica como gate pós-deploy.
- [x] Plano de migração: Postgres é canônico para usuários identificados; contas antigas apenas no Redis não bloqueiam release e viram suporte/migração pontual se forem encontradas.
- [x] Separação de `backend/src/server.js` fica explicitamente pós-liberação para evitar rewrite em véspera de release.
- [x] Renderer Markdown completo não entra antes do release; manter formatter atual e avaliar dependência depois.

────────────────────────────────────────

## ⧖ Dívida Técnica

- Consolidar helper único de resolução da URL pública da API.
- Atualizar comentários antigos de tier em `backend/schema.sql`.
- Separar helpers de URL pública do frontend em módulo único.
- Melhorar mensagens de erro no checkout sem revelar detalhes internos.
- Separar `backend/src/server.js` em rotas e middlewares.
- Avaliar renderer Markdown completo no frontend.
- Criar migração assistida se aparecer usuário legado existente apenas no Redis.

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
