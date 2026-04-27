<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->

```text
========================================
   NEO-CHAT-UNCENSORED · API REFERENCE
========================================
Base URL dev  : http://localhost:3001
Base URL prod : $PUBLIC_API_URL
Auth          : Bearer <neo_token> (JWT)
========================================
```

## ⟠ Chat

### `POST /api/chat`

Proxy para Venice AI com streaming SSE.

**Auth:** obrigatória  
**Rate limit:** 10 req/min (free) · 60 req/min (premium)  
**Quota:** verificada antes de cada request

**Body:**

```json
{
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "model": "venice-uncensored-1-2",
  "stream": true,
  "temperature": 0.7,
  "enableWebSearch": false
}
```

**Resposta (stream=true):** `text/event-stream` — formato SSE padrão OpenAI  
**Resposta (stream=false):** JSON com `{ ...veniceResponse, quota: { used, limit, remaining } }`

────────────────────────────────────────

## ⟠ Modelos

### `GET /api/models`

Lista modelos de texto disponíveis na Venice AI.

**Auth:** obrigatória

**Resposta:**

```json
{
  "available": ["venice-uncensored-1-2", "..."],
  "allModelDetails": [...],
  "currentTier": "free",
  "defaultModel": "venice-uncensored-1-2"
}
```

────────────────────────────────────────

## ⟠ Quota

### `GET /api/usage`

Consumo diário do usuário autenticado.

**Auth:** obrigatória

**Resposta:**

```json
{
  "today": 42,
  "limit": 100,
  "tier": "free",
  "remaining": 58
}
```

────────────────────────────────────────

## ⟠ Auth

### `POST /api/auth/signup`

**Rate limit:** 10 req / 15 min por IP

**Body:**

```json
{
  "name": "string (1–100)",
  "email": "string email válido",
  "password": "string (8–128 chars)"
}
```

**Resposta 201:**

```json
{
  "token": "<JWT 7d>",
  "user": { "id", "email", "name", "tier": "free" }
}
```

**Erros:** 400 (validação) · 409 (email já existe)

────────────────────────────────────────

### `POST /api/auth/login`

**Rate limit:** 10 req / 15 min por IP

**Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Resposta 200:**

```json
{
  "token": "<JWT 7d>",
  "user": { "id", "email", "tier" }
}
```

**Erros:** 400 (validação) · 401 (credenciais inválidas)

────────────────────────────────────────

## ⟠ Pagamentos (Fase 2 — FlowPay)

### `POST /flowpay/create-charge`

**Auth:** obrigatória

**Resposta:**

```json
{ "url": "https://flowpay.cash/checkout/..." }
```

### `POST /webhooks/flowpay`

Consumer interno do Nexus. Não chamado diretamente.  
Valida `X-Nexus-Signature` (HMAC-SHA256).  
Evento: `FLOWPAY:PAYMENT_RECEIVED`.
