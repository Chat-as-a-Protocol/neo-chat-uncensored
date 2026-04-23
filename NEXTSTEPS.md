# NEXT STEPS · RUNBOOK OPERACIONAL

## 1) Estado atual do produto (hoje)

### Entrada da aplicação

- Você entra pela rota `/`.
- Arquivo: `src/pages/index.astro`.

### Páginas existentes

- `/` → chat principal
- `/upgrade` → tela de upgrade (UI pronta)
- `/privacy-policy` → política
- `/terms-and-conditions` → termos

### API existente (backend)

- `POST /api/chat` → streaming SSE
- `GET /api/models` → modelos disponíveis
- `GET /api/usage` → consumo
- `POST /auth/login` → gera token (simplificado)
- `POST /stripe/create-checkout` → inicia checkout Stripe
- `POST /webhooks/stripe` → webhook de assinatura

## 2) O que está faltando no fluxo de produto

### Falta de navegação para onboarding

- Não há tela de cadastro/login no frontend (`/login`, `/signup` inexistentes).
- Hoje o chat funciona sem token via bypass dev no backend, então parece "entrar direto".

### Falta de jornada de pagamento completa

- Existe `/upgrade` e endpoint Stripe, mas não há:
  - tela de sucesso (`/success`)
  - tela de cancelamento dedicada
  - estado visual de plano atual no chat

### Falta de autenticação real

- `POST /auth/login` é stub (sem DB de usuários, sem bcrypt real, sem signup).

## 3) Ação imediata (prioridade)

1. Criar páginas:

- `/login`
- `/signup`
- `/success` (retorno Stripe)

1. Ajustar navegação do app:

- Header/menu com entrada para login e upgrade.
- Guardas simples no frontend (token no localStorage) para rotas privadas.

1. Endurecer backend auth:

- Remover bypass dev em produção.
- Criar fluxo real de usuário (DB + senha hash).

## 4) Deploy Railway (App + API separados)

## Serviço A: API (Node/Express)

- `Root Directory`: `backend`
- `Build Command`: `pnpm install --frozen-lockfile`
- `Start Command`: `pnpm start`
- `Porta`: Railway injeta `PORT` automaticamente

### Variáveis obrigatórias (API)

- `NODE_ENV=production`
- `PORT` (Railway injeta)
- `FRONTEND_URL=https://<seu-app-domain>`
- `VENICE_API_KEY=...`
- `VENICE_MODEL=venice-uncensored-1-2` (ou outro)
- `JWT_SECRET=...`
- `STRIPE_SECRET_KEY=...`
- `STRIPE_WEBHOOK_SECRET=...`
- `STRIPE_PRICE_ID_PRO=...`
- `REDIS_URL=...` (serviço Redis Railway)

### Webhook Stripe

- Endpoint no Stripe:
  - `https://<api-domain>/webhooks/stripe`

## Serviço B: App (Astro)

Projeto hoje está com `output: "static"` em `astro.config.mjs`.

Você tem 2 opções:

### Opção 1 (recomendada rápida): servir `dist` com Node

- `Root Directory`: `/` (raiz do repo)
- `Build Command`: `pnpm install --frozen-lockfile && pnpm build`
- `Start Command`: `pnpm dlx serve dist -l $PORT`

### Opção 2 (mais limpa para estático): hospedar frontend em plataforma estática

- Ex.: Vercel/Cloudflare Pages/Netlify
- Mantém Railway só para API + Redis

### Variáveis obrigatórias (App)

- `PUBLIC_API_URL=https://<api-domain>`

## 5) Checklist de publicação

1. Subir API no Railway (`backend` root).
2. Subir Redis no Railway e ligar `REDIS_URL`.
3. Configurar variáveis da API.
4. Configurar Stripe webhook para domínio da API.
5. Subir App com `PUBLIC_API_URL` apontando para API.
6. Testar:

- abrir `/`
- enviar mensagem (stream)
- abrir `/upgrade`
- iniciar checkout
- confirmar webhook alterando tier

## 6) Comandos locais úteis

### Desenvolvimento

- `make install`
- `make dev`

### Build produção

- `make build`

## 7) Próxima sessão (quando voltar)

Implementar em ordem:

1. `/login` + `/signup` + persistência de token
2. `/success` + confirmação de assinatura
3. Remover bypass dev em produção
4. UX final de onboarding/paywall
