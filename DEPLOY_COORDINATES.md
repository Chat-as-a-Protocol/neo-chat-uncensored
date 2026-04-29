# Deploy Coordinates

## Frontend Astro

```text
Root Directory : /
Build Command  : pnpm install --frozen-lockfile && pnpm build
Start Command  : pnpm dlx serve dist -l $PORT
Healthcheck    : /
```

### Environment

```env
# IMPORTANTE: Use a URL PÚBLICA do backend aqui (ex: https://api.up.railway.app)
# Não use a URL interna, pois o browser do usuário não a alcançará.
PUBLIC_API_URL=https://<url-da-api>
```

## Backend Express

```text
Root Directory : backend
Build Command  : pnpm install --frozen-lockfile
Start Command  : pnpm start
Healthcheck    : /health
```

### Environment

```env
NODE_ENV=production
FRONTEND_URL=https://<url-do-frontend>
VENICE_API_KEY=...
JWT_SECRET=...
REDIS_URL=...
FLOWPAY_API_URL=https://api.flowpay.cash
FLOWPAY_API_KEY=...
FLOWPAY_WEBHOOK_SECRET=...
```

## Current Git State

```text
main pushed: 116910f chore: remove repomix artifact
GitHub workflow: Context Lint passed
Railway CLI: local session unauthorized; use Railway GitHub deploy or run railway login
```
