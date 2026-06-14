<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# Next Steps

```text
========================================
          NØX · EXECUTION BACKLOG
========================================
Status: active
Updated: 2026-06-04
========================================
```

## ⧉ Checkpoint 2026-05-08

```text
STATUS CURTO
────────────
Hotfix de chat/ledger/guest aplicado e validado.
Alias de webhook aplicado no chat.
Compra PIX ainda precisa de teste real via Nexus
`ecosystem-subscriptions`.
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

- Paths de webhook aceitos no chat:

```text
POST /api/webhooks/flowpay  -> handler canônico
POST /webhooks/flowpay      -> alias compatível com Nexus
```

Nexus fan-out novo deve preferir:

```text
https://api.noxai.chat/api/webhooks/flowpay
```

- Smoke test do alias em produção passou:

```bash
curl -i -X POST https://api.noxai.chat/api/webhooks/flowpay \
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
POST /api/webhooks/flowpay - 401
```

Interpretação: isso confirma path/handler, mas não confirma fan-out assinado real do Nexus.

### Pendente Imediato

1. Fazer nova compra PIX real após o alias publicado.
2. Observar logs do backend procurando:

```text
POST /api/webhooks/flowpay
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

4. Se o webhook real ainda retornar `401 Missing Signature`,
   conferir no Nexus se a subscription está enviando
   `X-Nexus-Signature`
   e se `secretEnv` aponta para `FLOWPAY_WEBHOOK_SECRET`.
5. Se o webhook processar e Ledger creditar, validar:

```text
/upgrade redireciona ou atualiza estado
/success aparece
e-mail Resend chega
/api/usage reflete novo saldo
```

### Regra Para Retomar

```text
NÃO substituir target existente do Nexus.
O Nexus é control plane de vários projetos.
Adicionar NØX como nova subscription/consumer
em config/ecosystem.json.
```

Subscription recomendada:

```json
{
  "event": "FLOWPAY:PAYMENT_RECEIVED",
  "target": {
    "kind": "webhook",
    "url": "https://api.noxai.chat/api/webhooks/flowpay"
  },
  "secretEnv": "FLOWPAY_WEBHOOK_SECRET"
}
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
┃ E-mail             ┃ Resend API via backend
┃ Planos             ┃ shared/plans.json
┃ Preços             ┃ /pricing público, /upgrade identificado
┃ Guest Mode         ┃ Controlado, não exibido em /upgrade
┃ CORS               ┃ Preflight 204 só para origins permitidas
┃ Ledger             ┃ LEDGER-FIRST ativo — paid via getBalance()
┗━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Topologia canônica:
`docs/DEPLOY_TOPOLOGY.md`.

Railway deve permanecer enxuto:

```text
FRONTEND
backend
Postgres
Redis
```

`Resend Mail`, se existir apenas como starter,
deve sair do desenho operacional.

Resend é provider externo chamado pelo backend.

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
- Resend tratado como API externa,
  não serviço Railway obrigatório.
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

### 🛑 Investigação de Webhook (Woovi -> FlowPay) - Retomar no Domingo
O teste de compra PIX foi feito em produção (User pagou R$ 5,00, Ordem 44).
A ordem consta como `CREATED` no D1 (`flowpay_api_prod`), o que significa que o FlowPay não absorveu o webhook da Woovi.
**Passos para domingo:**
1. **Validar Woovi Dashboard**: Abrir o log de webhooks na Woovi e procurar a tentativa de entrega para `https://api.flowpay.cash/api/webhook`.
2. **Checar Erro 401**: Se a Woovi estiver recebendo erro 401 do FlowPay, é porque o FlowPay falhou na validação HMAC.
3. **Corrigir Secret**: Pegar o Webhook Secret no painel da Woovi e preencher na variável `WOOVI_WEBHOOK_SECRET` do dashboard da Cloudflare no projeto FlowPay. Atualmente o FlowPay está caindo no fallback e quebrando a assinatura.
4. Quando resolvido, a ordem mudará para `COMPLETED` no D1 e o FlowPay fará o fan-out seguro (NEXUS_SECRET_NEW) pro Nexus.

### Tarefas Gerais
1. ~~Conferir variáveis do backend no Railway~~ — **CONCLUÍDO** (`FLOWPAY_API_KEY` e `FLOWPAY_API_URL` configuradas em 2026-05-06).
2. Fazer smoke test pós-deploy:
   signup, login, guest chat, `/api/usage`, magic link e `/account`.
3. ~~Validar geração de cobrança PIX~~ — **CONCLUÍDO** (QR renderizado na UI `/upgrade` em produção).
4. **Confirmar webhook FlowPay via Nexus em produção** —
   pagamento real → Nexus subscription → ledger → tokens creditados.
5. Verificar domínio Resend `send@noxai.chat`.
6. Remover ou arquivar serviço `Resend Mail` no Railway
   se ele for apenas starter/placeholder.
7. ~~Desenvolver Hamburger Menu Mobile~~ — **CONCLUÍDO** (2026-06-05).
   - Menu (☰↔✕) no header do chat, abre com efeito; contém Assinar PRO (CTA), Preços, Conta, Telegram e legal Privacy·Terms.
   - **Decisão do operador (diverge da spec original):** o menu fica **sempre visível** (header sticky), não só com o chat ativo — mantém o CTA de planos acessível mesmo com o teclado aberto, priorizando conversão.
   - `scene-footer` enxugado para apenas `Privacy · Terms` (navegação migrou para o menu).
   - Complemento de conversão: modal `#quota-modal` + e-mail `sendBalanceDepleted` ao esgotar saldo (ver `AGENTS.md`).
8. **Migração Event-Driven (Neo Growth System):**
   - Refatorar o envio de e-mails (`email.js`) delegando a
     responsabilidade para o `neo-growth-system`
     ou nó provider Resend formal.
   - O NØX deve emitir evento.
     O sistema de growth deve entregar,
     auditar e reprocessar.

9. **Extração do Chat Runtime**
   - Tratar o chat atual do NØX como runtime interno transitório.
   - Planejar saída para nó próprio apenas após release rápido.
   - Contrato futuro:

```text
NØX Backend -> Chat Runtime Node
```

   - NØX mantém auth,
     entitlement,
     ledger
     e billing.
   - O nó de chat executa conversa/agentes por contrato.
   - Seguir o blueprint documentado em `docs/EVENT_DRIVEN_MIGRATION_PLAN.md`.
10. **Melhoria da Interface (UI) dos E-mails:**
   - O template HTML base (`renderTemplate` em `email.js` ou futuro `neo-provider-resend`) está muito básico (fundo branco/claro) sem logo e sem identidade visual do NØX.
   - Precisa receber o banho de estética Dark Mode/Premium com as paletas de luxo do NØX, para que qualquer disparo transmita o ar "Soberano/Hacker".

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

- Criar novas personas temáticas (ex: dev sênior, tutor, assistente premium) aproveitando a arquitetura de manifestos dinâmicos em `src/content/manifests/` e envio de `personaId` via body no `/api/chat`.
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
