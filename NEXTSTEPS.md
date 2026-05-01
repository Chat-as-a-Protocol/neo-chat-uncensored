<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
========================================
    NEXT STEPS · RUNBOOK OPERACIONAL
========================================

> **Status:** PRÉ-MVP (bug fixes pendentes antes do launch)  
> **Workspace:** Chat-as-a-Protocol / neo-chat-uncensored  
> **Branch:** main

────────────────────────────────────────

## ⧉ Estado Atual

```text
Workspace : Chat-as-a-Protocol / neo-chat-uncensored
Branch    : main
Fase      : PRÉ-MVP (bug fixes pendentes antes do launch)
```

────────────────────────────────────────

## ⧉ Páginas e Rotas

- `/` → chat principal (`src/pages/index.astro`)
- `/login` → autenticação (`src/pages/login.astro`)
- `/signup` → cadastro (`src/pages/signup.astro`)
- `/success` → confirmação de pagamento (`src/pages/success.astro`)
- `/upgrade` → planos (`src/pages/upgrade.astro`)
- `/privacy-policy` → política (`src/pages/privacy-policy.astro`)
- `/terms-and-conditions` → termos (`src/pages/terms-and-conditions.astro`)

────────────────────────────────────────

## ⧉ API Backend

- `POST /api/chat` → streaming SSE para Venice AI
- `GET /api/models` → modelos disponíveis da Venice
- `GET /api/usage` → consumo diário do usuário
- `POST /api/auth/login` → gera JWT (bcrypt implementado)
- `POST /api/auth/signup` → cria conta (bcrypt implementado)
- `POST /stripe/create-checkout` → inicia checkout Stripe (a migrar para FlowPay)
- `POST /webhooks/stripe` → webhook de assinatura (a migrar para FlowPay via Nexus)

────────────────────────────────────────

## ⟠ Checklist de Estado

### Infraestrutura

- [x] Astro migrado para v6 com output estático
- [x] Workspace pnpm configurado (`pnpm-workspace.yaml`)
- [x] SceneBackground extraído como componente reutilizável
- [x] Componentes UI reutilizáveis: `Button`, `Card`, `Input`
- [x] Layout global com design tokens CSS (accent, glass, tipografia)
- [x] Tailwind configurado com `@astrojs/tailwind`

### Auth e Backend

- [x] Página `/login` criada com formulário e integração à API
- [x] Página `/signup` criada com formulário e integração à API
- [x] Página `/success` criada (retorno do checkout)
- [x] Backend: bcrypt (custo 12) para hash de senha no signup
- [x] Backend: verificação bcrypt no login
- [x] Backend: JWT sem fallback hardcoded — ephemeral em dev, fatal em prod
- [x] Backend: validação de env vars obrigatórias na inicialização de produção
- [x] Backend: Stripe webhook com `express.raw()` antes do `express.json()`
- [x] Backend: `trust proxy 1` para Railway + AbortError → 504
- [x] Backend: rate limit no webhook Stripe
- [x] Backend: Mock Redis in-memory para dev (sem Docker)
- [x] Backend: helmet, CORS, rate limiting por usuário e por tier
- [x] Backend: validação de input com Zod
- [x] `backend/package-lock.json` npm removido — workspace gerenciado por pnpm

### Chat UI

- [x] Streaming SSE com cursor animado
- [x] Typing indicator (pontos animados)
- [x] Auto-scroll inteligente (detecta se usuário está no fundo)
- [x] Retry em caso de erro
- [x] Escape HTML para prevenir XSS
- [x] Formatação básica: bold, code blocks
- [x] Timestamp por mensagem
- [x] Animação de send (bounce)
- [x] Textarea auto-resize
- [x] Enter para enviar, Shift+Enter para nova linha

────────────────────────────────────────

## ⨷ Fase 0 · Bug Fixes

> **Importante:** Executar antes de qualquer deploy de produção.

- [x] **[BUG] Token key inconsistente em `upgrade.astro`**
  - Arquivo: `src/pages/upgrade.astro`
  - Fix aplicado: `'token'` → `'neo_token'`

- [x] **[BUG] `window.PUBLIC_API_URL` não funciona no browser**
  - Arquivo: `src/pages/upgrade.astro`
  - Fix aplicado: `is:inline` substituído por `define:vars` com `import.meta.env.PUBLIC_API_URL`

- [x] **[UX] Signup não usa o token retornado**
  - Arquivo: `src/pages/signup.astro`
  - Fix aplicado: salva `neo_token` no localStorage + redirect direto para `/`

- [x] **[LINK] Link `/docs` em `success.astro`**
  - Arquivo: `src/pages/success.astro`
  - Fix aplicado: link duplicado removido (já havia botão "Ir para o Chat")
  - `docs/` reestruturado como Knowledge Base soberana (README, ARCHITECTURE, API, PAYMENTS, DEPLOY)
  - Banner SVG movido de `docs/assets/` para `public/` (propósito correto)

- [x] **[AUTH] Auth guard no frontend para produção**
  - Arquivo: `src/pages/index.astro`
  - Fix aplicado: redirect para `/login` quando `neo_token` ausente em `import.meta.env.PROD`

- [x] **[LEDGER] Implementar Sovereign Ledger (Fase 0)**
  - Arquivo: `backend/src/server.js` (refatorado para `services/ledger.js`)
  - Fix aplicado: Implementado `ledgerService` no Redis (estrutura de lista append-only)
  - Substituído `usage:{userId}:{date}` por agregação dinâmica `getDailyUsage`
  - Adicionado endpoint `GET /api/ledger` e evento `PURCHASE` no webhook FlowPay

- [x] **[TESTS] Implementar Testes Unitários e Modularização**
  - Arquivos: `backend/src/services/ledger.test.js`, `backend/src/utils/billing.test.js`
  - Fix aplicado: Setup de testes usando o runner nativo do Node.js 20 (zero-dependency)
  - Refatoração: Lógica de Redis, Ledger e Billing extraída para módulos independentes
  - Automação: Integrado `make test` no pipeline de qualidade `make check`

────────────────────────────────────────

## ⟠ Fase 1 · MVP Completo

### Persona e Experience

- [ ] **System prompt / persona NØX.ai**
  - **Ação Requerida**: Criar `docs/SYSTEM_PROMPT.md` com a persona blasé.
  - Integração no `backend/src/server.js` pronta para ler o arquivo (atualmente usando fallback).

- [x] **Indicador de quota no chat**
  - Exibição dinâmica de `uso/limite` integrada na Brand Pill
  - Atualização automática após cada mensagem

- [ ] **Finalizar Fontes Locais (Privacidade)**
  - [x] Infraestrutura e CSS configurados em `Layout.astro`
  - [ ] **Ação Requerida**: Fazer upload de `manrope-variable.ttf` e `space-grotesk-variable.ttf` para `public/fonts/`

- [x] **Consolidação de Documentação e Limpeza**
  - [x] Pasta `neo-ai/` eliminada; arquivos críticos movidos para `docs/`
  - [x] Duplicatas de `ARCHITECTURE.md` e `README.md` removidas
  - [x] Referências de estilo centralizadas no diretório pai `Chat-as-a-Protocol`

- [x] **Refino da Interface (UX)**
  - [x] Revisar mensagem de abertura para alinhar 100% com NØX.ai
  - [x] Remover logs de depuração do console em `AstroChatInterface.astro`

────────────────────────────────────────

## ⟠ Fase 2 · FlowPay

> **Contexto**: este projeto faz parte do ecossistema NEO Protocol.
> O padrão de pagamento canônico do ecossistema usa **FlowPay** como
> único gateway, mediado pelo **Nexus** (event hub), **não Stripe**.
> Ver `docs/CONTEXT.md` para detalhes completos do padrão.

### Padrão de Integração

```text
FlowPay (api.flowpay.cash)
  → emite FLOWPAY:PAYMENT_RECEIVED para Nexus
    → Nexus (nexus.neoprotocol.space/api/events)
      → entrega para neo-chat-uncensored via /webhooks/flowpay
        → backend atualiza tier do usuário no Redis
```

### Checklist de Migração Stripe → FlowPay

- [ ] Declarar `neo-chat-uncensored` como nó consumidor no `ecosystem.json`
  - Arquivo: `neobot-orchestrator/config/ecosystem.json`
  - Adicionar `nexusEvents.subscriptions[]`
  - Evento: `"FLOWPAY:PAYMENT_RECEIVED"`
  - `secretEnv`: `NEO_CHAT_WEBHOOK_SECRET`
  - `target.path`: `/webhooks/flowpay`

- [x] Criar endpoint `POST /webhooks/flowpay` no backend
- [x] Remover vestígios do Stripe no backend e frontend
- [x] Atualizar o botão "Upgrade" no frontend para apontar para o FlowPay
- [x] Validar assinatura `X-Nexus-Signature` (HMAC-SHA256)
- [x] Processar `FLOWPAY:PAYMENT_RECEIVED` de forma idempotente
  - Atualizar tier do usuário no Redis (equivalente ao atual webhook Stripe)

- [x] Substituir `POST /stripe/create-checkout` por `POST /flowpay/create-charge`
  - API FlowPay: `POST https://api.flowpay.cash/api/create-charge`
  - Env vars: `FLOWPAY_API_URL`, `FLOWPAY_API_KEY`
  - Retorna URL de checkout gerenciado pela FlowPay

- [x] Atualizar `upgrade.astro` para chamar `/api/flowpay/create-charge`

- [x] Remover dependência do Stripe quando FlowPay estiver operacional

- [x] Implementar Feature Toggles para controle de páginas (`ENABLE_AUTH_PAGES`)
- [x] Criar esquema inicial do PostgreSQL (`backend/schema.sql`)
- [ ] Migrar persistência de usuários/ledger do Redis para PostgreSQL (mantendo Redis para cache/sessões)

────────────────────────────────────────

## ⟠ Fase 3 · Crescimento

- [x] Banco de dados real para usuários (Turso/PostgreSQL) em vez de Redis puro
- [ ] Histórico de conversas — local ou criptografado no server
- [ ] Password reset flow (email via Resend ou FlowPay)
- [x] Personas customizáveis (módulos dinâmicos via manifests)
- [ ] **Marketplace de Personas**: Sistema para terceiros venderem prompts (comissão 30% padrão)
- [ ] **Sistema de Indicação (Referral)**: Links de indicação para crescimento viral e recompensas em tokens
- [ ] Contagem real de tokens no streaming (ao invés da heurística atual)

────────────────────────────────────────

## ⟠ Fase 4 · Escala e Web3

- [ ] Pagamento crypto: integração com FlowPay token (NEOPAY / ERC-20 na Base)
  - Contrato: `0xD49d3Fb2C2CBBA78a1E710660a628919eE78D82A`
- [ ] API key para desenvolvedores (Chat as a Protocol)
- [ ] Multi-tenant: domínio próprio por cliente (white-label)
- [ ] Rate limit por IP em `/api/auth` (além do por usuário existente)

────────────────────────────────────────

## ◬ Deploy Railway

### Serviço A: API (Node/Express)

- `Root Directory`: `backend`
- `Build Command`: `pnpm install --frozen-lockfile`
- `Start Command`: `pnpm start`
- Porta: Railway injeta `PORT` automaticamente

#### Variáveis obrigatórias (API)

```env
NODE_ENV=production
FRONTEND_URL=https://<seu-app-domain>
VENICE_API_KEY=...
VENICE_MODEL=venice-uncensored-1-2
JWT_SECRET=...
REDIS_URL=...
FLOWPAY_API_URL=https://api.flowpay.cash
FLOWPAY_API_KEY=...
NEO_CHAT_WEBHOOK_SECRET=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_ID_PRO=...
```

### Webhook FlowPay via Nexus

Configurar no `ecosystem.json` do NEO Protocol:

```json
{
  "id": "neo-chat-uncensored",
  "nexusEvents": {
    "subscriptions": [
      {
        "event": "FLOWPAY:PAYMENT_RECEIVED",
        "target": {
          "kind": "webhook",
          "path": "/webhooks/flowpay"
        },
        "secretEnv": "NEO_CHAT_WEBHOOK_SECRET"
      }
    ]
  }
}
```

### Serviço B: App (Astro estático)

- `Root Directory`: `/` (raiz do repo)
- `Build Command`: `pnpm install --frozen-lockfile && pnpm build`
- `Start Command`: `pnpm dlx serve dist -l $PORT`

#### Variáveis obrigatórias (App)

```env
PUBLIC_API_URL=https://<api-domain>
```

────────────────────────────────────────

## ◬ Comandos Locais

```bash
# Instalar dependências (workspace completo)
pnpm install

# Desenvolvimento (frontend + backend separados)
make dev

# Build produção
make build
```

────────────────────────────────────────

## ⟠ Checklist de Publicação

1. [ ] Corrigir todos os bugs da Fase 0
2. [ ] Subir API no Railway (`backend` root)
3. [ ] Subir Redis no Railway e conectar `REDIS_URL`
4. [ ] Configurar variáveis da API
5. [ ] Subir App com `PUBLIC_API_URL` apontando para API
6. [ ] Testar fluxo completo:
   - [ ] abrir `/` e enviar mensagem (stream)
   - [ ] criar conta em `/signup` e ser redirecionado para chat
   - [ ] fazer login em `/login`
   - [ ] abrir `/upgrade` e iniciar checkout
   - [ ] confirmar webhook alterando tier
7. [ ] (Fase 2) Declarar `neo-chat-uncensored` no `ecosystem.json`
8. [ ] (Fase 2) Configurar Nexus para entregar `FLOWPAY:PAYMENT_RECEIVED`

────────────────────────────────────────

```text
▓▓▓ NΞØ MELLØ
────────────────────────────────────────
Core Architect · NΞØ Protocol
neo@neoprotocol.space

"Code is law. Expand until
chaos becomes protocol."

Security by design.
Explits find no refuge here.
────────────────────────────────────────
```
