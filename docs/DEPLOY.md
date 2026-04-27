<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->

```text
========================================
   NEO-CHAT-UNCENSORED · DEPLOY
========================================
Platform : Railway (API) + Railway/Vercel (Frontend)
========================================
```

## ⟠ Serviço A — API (Node/Express)

```text
Root Directory  : backend
Build Command   : pnpm install --frozen-lockfile
Start Command   : pnpm start
Port            : Railway injeta $PORT automaticamente
```

### Variáveis de Ambiente — API

```env
NODE_ENV=production
FRONTEND_URL=https://<seu-app-domain>
VENICE_API_KEY=...
VENICE_MODEL=venice-uncensored-1-2
JWT_SECRET=...                         # mínimo 32 chars, aleatório
REDIS_URL=...                          # serviço Redis do Railway

# FlowPay (Fase 2)
FLOWPAY_API_URL=https://api.flowpay.cash
FLOWPAY_API_KEY=...
NEO_CHAT_WEBHOOK_SECRET=...

# Stripe (enquanto não migrado — remover após Fase 2)
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_ID_PRO=...
```

## ⟠ Serviço B — Frontend (Astro Estático)

```text
Root Directory  : /  (raiz do repo)
Build Command   : pnpm install --frozen-lockfile && pnpm build
Start Command   : pnpm dlx serve dist -l $PORT
```

**Alternativa:** hospedar `dist/` em Vercel/Cloudflare Pages (recomendado para estático).

### Variáveis de Ambiente — Frontend

```env
PUBLIC_API_URL=https://<api-domain>
```

## ⧇ Checklist de Publicação

```text
[ ] Corrigir todos os bugs da Fase 0 (ver NEXTSTEPS.md)
[ ] Subir API no Railway (backend root)
[ ] Subir Redis no Railway → conectar REDIS_URL
[ ] Configurar variáveis da API
[ ] Subir Frontend com PUBLIC_API_URL apontando para API
[ ] Testar fluxo completo:
    [ ] / → enviar mensagem (stream)
    [ ] /signup → criar conta → redirect para chat
    [ ] /login → autenticar
    [ ] /upgrade → iniciar checkout
    [ ] webhook → confirmar atualização de tier
[ ] (Fase 2) Declarar nó no ecosystem.json
[ ] (Fase 2) Configurar NEO_CHAT_WEBHOOK_SECRET no Nexus e no Railway
```

## ◬ Comandos Locais

```bash
pnpm install        # instala todos os pacotes (workspace)
make dev            # inicia frontend + backend
make build          # build de produção
make audit          # auditoria de segurança
```
