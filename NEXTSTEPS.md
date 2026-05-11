<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# Next Steps

```text
========================================
          NØX · EXECUTION BACKLOG
========================================
Status: active
Updated: 2026-05-08
========================================
```

## ⧉ Checkpoint 2026-05-08

```text
STATUS CURTO
────────────
Hotfix de chat/ledger/guest aplicado e validado.
Alias de webhook do Nexus aplicado no chat.
Compra PIX ainda precisa de teste real assinado via Nexus.
```

### Concluído Hoje

- `checkQuota` não desconta mais histórico/input/buffer do saldo do usuário.
- Débito não-streaming passou a usar `completion_tokens`/output, não `total_tokens`.
- Guest/free não são mais confundidos com compra real.
- `TOKEN_GRANT` criado para crédito inicial gratuito no Ledger.
- `TOKEN_PURCHASE` reservado para compra real via FlowPay/packages.
- `/api/usage` de guest novo validado:

```json
{
  "limit": 500,
  "tier": "guest",
  "plan": "guest",
  "balance": 500,
  "remaining": 500,
  "maxOutputTokens": 184
}
```

- Validações locais passaram:

```bash
node --check backend/src/server.js
pnpm --dir backend test
pnpm check
pnpm build
```

- Alias de webhook aplicado no chat:

```text
POST /api/webhooks/flowpay  -> handler canônico
POST /webhooks/flowpay      -> alias compatível com Nexus
```

- Smoke test do alias em produção passou:

```bash
curl -i -X POST https://api.noxai.chat/webhooks/flowpay \
  -H "Content-Type: application/json" \
  --data '{}'
```

Resultado esperado e observado:

```text
HTTP 401
Unauthorized: Missing Signature
```

Interpretação: a rota existe em produção. O `401` é correto para chamada manual sem assinatura HMAC.

### Evidência do Log Atual

Log visto no Railway após o `curl` manual:

```text
[Webhook] Received FlowPay event from Nexus
[Webhook] Missing signature
POST /webhooks/flowpay - 401
```

Interpretação: isso confirma path/handler, mas não confirma fan-out assinado real do Nexus.

### Pendente Imediato

1. Fazer nova compra PIX real após o alias publicado.
2. Observar logs do backend procurando:

```text
POST /webhooks/flowpay
[Webhook] Received FlowPay event from Nexus
[Webhook] User <id> purchased <tokens> tokens
[Email] Payment email sent for user <id>
```

3. Verificar Ledger no Postgres, sem `LIMIT` manual no Railway Data UI:

```sql
SELECT id, user_id, amount, type, reference, created_at
FROM ledger
WHERE reference LIKE '%nox_tokens_1k%'
ORDER BY created_at DESC
```

4. Se o webhook real ainda retornar `401 Missing Signature`, conferir no Nexus se o fan-out está enviando `X-Nexus-Signature` e se o secret usado pelo Nexus corresponde ao `FLOWPAY_WEBHOOK_SECRET` do backend NØX.
5. Se o webhook processar e Ledger creditar, validar:

```text
/upgrade redireciona ou atualiza estado
/success aparece
e-mail Resend chega
/api/usage reflete novo saldo
```

### Regra Para Retomar

```text
NÃO alterar Nexus/ecosystem.json como hotfix local.
O Nexus é control plane de vários projetos.
Para o NØX, manter compatibilidade local via alias no chat.
```

────────────────────────────────────────

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
┃ Preços             ┃ /pricing público, /upgrade identificado
┃ Guest Mode         ┃ Controlado, não exibido em /upgrade
┃ CORS               ┃ Preflight 204 só para origins permitidas
┃ Ledger             ┃ LEDGER-FIRST ativo — paid via getBalance()
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
- Testes unitários de ledger, billing, payments e FlowPay (35 testes, 35/35).
- `/pricing` público para descoberta comercial sem login.
- `/account` exibe nome e e-mail via `/api/usage`.

- **CORS Hardened**: preflight `OPTIONS` responde `204` só para origins válidas; `Vary: Origin` e `crossOriginResourcePolicy: false` no Helmet.

- **LEDGER-FIRST**: `checkQuota` com árvore de 3 modos (LEDGER / SUBSCRIPTION / FREE) via `hasLedgerBalance` + `hasActiveSubscription`. HTTP 402 apenas sem saldo e sem assinatura real.

- **Payments hardening**: `metadata.type` vazio retorna `kind:unknown`; `token_purchase` com tokens ≤0 retorna `kind:unknown`. Sem fail-open para `pro_subscription`.

- **balanceAfter**: `addEntry` retorna saldo pós-debit (CTE Postgres + soma Redis). `/api/chat` usa saldo real, sem STALE.

- **Protocol Hardening v1**: JWT de identidade pura, cota dinâmica via Postgres, welcome bonus (1000 tokens) e blindagem de stream no ledger. **CONCLUÍDO (2026-05-06)**.
- **plans.json v2**: Nomes e benefícios normalizados (`Citizen`, `Operator`). **CONCLUÍDO**.
- **Auth Sync 2026-05-11**: cookie guest não vence token identificado; token real é promovido para cookie e `/account` renderiza nome/e-mail.
- **PNPM/Railway 2026-05-11**: overrides ficam em `pnpm-workspace.yaml`; Docker runtime copia o arquivo antes de `pnpm install --prod --frozen-lockfile`.

────────────────────────────────────────

## ⨷ Pendente Imediato

1. ~~Conferir variáveis do backend no Railway~~ — **CONCLUÍDO** (`FLOWPAY_API_KEY` e `FLOWPAY_API_URL` configuradas em 2026-05-06).
2. Fazer smoke test pós-deploy:
   signup, login, guest chat, `/api/usage`, magic link e `/account`.
3. ~~Validar geração de cobrança PIX~~ — **CONCLUÍDO** (QR renderizado na UI `/upgrade` em produção).
4. **Confirmar webhook FlowPay via Nexus em produção** — pagamento real → nexus → ledger → tokens creditados.
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

### ⧉ Fase 2 — Ledger (identificado em code review 2026-05-06)

```text
PRIORIDADE  ITEM
──────────  ────────────────────────────────────────────────────────────────
ALTA        Race condition de saldo: dois requests paralelos podem levar
            balance a negativo. Requer reservation/lock atômico ou
            SELECT ... FOR UPDATE antes do debit.

MÉDIA       newBalance na resposta é STALE: capturado no checkQuota antes
            do consumo real. Em requests paralelos, UI exibe saldo errado.
            Fix: retornar balanceAfter direto do addEntry (query pós-debit).

BAIXA       Webhook idempotência por paymentId: se FlowPay emitir mesmo
            evento com ID diferente, ON CONFLICT não protege. Mitigação:
            hash do conteúdo (amount + userId + timestamp) como chave
            secundária de deduplicação.
```

**O que já está protegido:**

- `ON CONFLICT(reference)` no `ledger.addEntry` → webhook duplicado mesmo ID: seguro.
- Debit só após Venice responder → timeout/erro não debita: seguro.
- `req.availableCredits` (LEDGER mode) separado de `req.dailyLimit` (SUBSCRIPTION/FREE): semântica correta.
- ~~newBalance STALE~~ → **resolvido**: `addEntry` retorna `balanceAfter` real (CTE Postgres + Redis).

────────────────────────────────────────

## ⧉ Pós-release Comercial

- Criar e-mails de confirmação segmentados por plano/pacote.
- Incluir dicas práticas de uso conforme o nível comprado.
- Definir comandos reais antes de divulgar:
  `/fast`, `/medium`, `/deep` ou equivalentes.
- Ensinar economia de créditos, clareza de pedido e melhor retorno do NØX.
- Manter o tom como onboarding inteligente, sem prometer suporte humano direto.
- Usar o e-mail pós-compra para reforçar valor percebido logo após o pagamento.

────────────────────────────────────────

## ⧗ Validação

Antes de push:

```bash
make check
make build
fnm exec --using v25.9.0 pnpm audit --prod=false
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
