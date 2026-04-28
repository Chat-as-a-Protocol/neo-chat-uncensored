<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->

```text
========================================
   NEO-CHAT-UNCENSORED · API REFERENCE
========================================
Base URL dev  : http://localhost:3001
Base URL prod : $PUBLIC_API_URL
Auth          : Bearer <neo_token> (JWT)
Content-Type  : application/json
Body limit    : 64kb
========================================
```

## ⟠ Chat

### `POST /api/chat`

Proxy para Venice AI com streaming SSE. System prompt carregado de cache.

**Auth:** obrigatória  
**Rate limit:** 10 req/min (free) · 60 req/min (premium, via Redis tier)  
**Quota:** verificada antes de cada request (ledger diário)

**Body (validado com Zod):**

```json
{
  "messages": [
    { "role": "user", "content": "string (1–32000 chars)" }
  ],
  "model": "venice-uncensored-1-2",
  "stream": true,
  "temperature": 0.7,
  "enableWebSearch": false
}
```

**Limites:** `messages` mín. 1, máx. 50 itens · `role` enum: `system|user|assistant`  
**Timeout Venice:** 30s (configurável via `VENICE_TIMEOUT_MS`)

**Resposta (stream=true):** `text/event-stream` — formato SSE padrão OpenAI  
**Resposta (stream=false):**

```json
{
  "...veniceResponse",
  "quota": { "used": 42, "limit": 100, "remaining": 58 }
}
```

**Erros:** 400 (validação) · 401 (token) · 403 (quota) · 429 (rate limit) · 502 (Venice) · 504 (timeout)

────────────────────────────────────────

## ⟠ Modelos

### `GET /api/models`

Lista modelos de texto disponíveis na Venice AI. Timeout interno de 10s.

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

## ⟠ Quota e Ledger

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

### `GET /api/ledger`

Extrato completo de créditos/débitos do usuário (máx. 1000 entradas).

**Auth:** obrigatória

**Resposta:**

```json
{
  "balance": 99958,
  "statement": [
    {
      "id": "uuid",
      "userId": "user_sha256",
      "amount": -42,
      "type": "CONSUMPTION",
      "reference": "venice_stream_uuid",
      "createdAt": 1714320000000
    }
  ]
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
  "email": "email válido (máx 254)",
  "password": "string (8–128 chars)"
}
```

**Resposta 201:**

```json
{
  "token": "<JWT>",
  "user": { "id": "user_sha256", "email", "name", "tier": "free" }
}
```

**Erros:** 400 (validação) · 409 (email já existe)

> **Nota:** O `id` retornado é um hash SHA-256 unidirecional do email — não reversível.

────────────────────────────────────────

### `POST /api/auth/login`

**Rate limit:** 10 req / 15 min por IP  
**Timing-safe:** bcrypt sempre executado, mesmo para emails inexistentes (previne user enumeration)

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
  "token": "<JWT>",
  "user": { "id": "user_sha256", "email", "tier" }
}
```

**Erros:** 400 (validação) · 401 (credenciais inválidas)

────────────────────────────────────────

## ⟠ Pagamentos (FlowPay)

### `POST /api/flowpay/create-charge`

**Auth:** obrigatória  
**Timeout FlowPay:** 10s

**Body:**

```json
{ "plan": "pro" }
```

**Resposta:**

```json
{ "checkoutUrl": "https://flowpay.cash/checkout/..." }
```

**Erros:** 400 (plano inválido) · 503 (chave não configurada) · 502 (FlowPay error) · 504 (timeout)

────────────────────────────────────────

### `POST /webhooks/flowpay`

Consumer interno do Nexus. **Nunca chamado diretamente pelo frontend.**

**Segurança:** `X-Nexus-Signature` obrigatório — HMAC-SHA256 com `timingSafeEqual`  
**Body limit:** 16kb  
**Evento tratado:** `FLOWPAY:PAYMENT_RECEIVED`

**Ação ao receber evento:**
- `tier:{userId}` → `"pro"` (Redis SET)
- `ledger:{userId}` → entrada `+100000` tipo `PURCHASE`

**Resposta 200:**

```json
{ "status": "success", "message": "Tier updated." }
```

**Erros:** 400 (payload inválido) · 401 (assinatura inválida)

────────────────────────────────────────

## ⟠ Health

### `GET /health`

```json
{ "status": "ok", "uptime": 3600.42, "timestamp": "2026-04-28T20:00:00.000Z" }
```
