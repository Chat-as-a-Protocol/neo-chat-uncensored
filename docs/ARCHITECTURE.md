<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->

```text
========================================
   NEO-CHAT-UNCENSORED · ARCHITECTURE
========================================
Version: v2.1.0
========================================
```

## ⟠ Topologia

```text
Browser
  └─ Astro 6 (output: static)
       ├─ /            → AstroChatInterface (streaming SSE)
       ├─ /login       → formulário + JWT localStorage
       ├─ /signup      → cadastro + auto-login
       ├─ /upgrade     → planos + checkout FlowPay
       └─ /success     → confirmação pós-pagamento

API Backend (Express / Railway)
  ├─ POST /api/chat                → proxy Venice AI (SSE stream)
  ├─ GET  /api/models              → lista modelos Venice (com timeout 10s)
  ├─ GET  /api/usage               → quota diária do usuário
  ├─ GET  /api/ledger              → extrato completo + saldo
  ├─ POST /api/auth/login          → JWT (bcrypt verify, timing-safe)
  ├─ POST /api/auth/signup         → bcrypt hash + JWT + pipeline Redis
  ├─ POST /api/flowpay/create-charge → checkout FlowPay (com timeout 10s)
  ├─ POST /webhooks/flowpay        → consumer Nexus (HMAC-SHA256)
  └─ GET  /health                  → status + uptime + timestamp

Redis (Railway ou mock in-memory em dev)
  ├─ tier:{userId}          → "free" | "pro"
  ├─ limit:{userId}         → tokens/dia permitidos (padrão: 100)
  ├─ password:{userId}      → bcrypt hash da senha
  └─ ledger:{userId}        → lista LIFO de entradas (max 1000, via ltrim)

Venice AI
  └─ POST /api/v1/chat/completions (SSE stream, timeout 30s)

FlowPay → Nexus → Backend
  └─ POST /webhooks/flowpay (HMAC-SHA256 timingSafeEqual obrigatório)
```

## ⧉ Fluxo de Dados — Chat

```text
1. Usuário digita mensagem
2. Frontend: POST /api/chat (Bearer token)
3. authenticateToken → createUserRateLimit → checkQuota
4. System prompt carregado do cache em memória (boot-time)
5. Backend proxia Venice AI com AbortController (30s timeout)
6. Stream SSE pipe → cliente em tempo real (TextDecoder reutilizado)
7. reader.releaseLock() garantido via try/finally
8. ledgerService.addEntry (assíncrono, não bloqueia resposta)
```

## ⧇ Fluxo de Pagamento — FlowPay

```text
1. Usuário clica "Fazer Upgrade"
2. Frontend: POST /api/flowpay/create-charge
3. Backend valida request (Zod), chama FlowPay API (timeout 10s)
4. Verifica Content-Type antes de deserializar resposta
5. Retorna { checkoutUrl } ao frontend
6. Usuário completa pagamento em flowpay.cash
7. FlowPay → Nexus → POST /webhooks/flowpay (X-Nexus-Signature)
8. Backend: HMAC-SHA256 timingSafeEqual
9. Pipeline Redis: set tier:userId = "pro" (atômico)
10. ledgerService.addEntry(userId, 100000, "PURCHASE") → créditos injetados
```

## ◬ Decisões de Arquitetura

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Frontend | Astro 6 static | Performance extrema, zero JS desnecessário |
| Streaming | SSE nativo | Compatível Venice, sem WebSocket overhead |
| Auth | JWT + bcrypt + Redis | Zero banco de dados no MVP |
| userId | SHA-256 do email | Unidirecional, não reversível |
| Pagamentos | FlowPay via Nexus | Padrão canônico do ecossistema NEO |
| Dev local | Redis mock in-memory | Zero dependências de infra |
| System Prompt | Cache em memória | Evita I/O de disco em cada request |
| Ledger | Redis List + ltrim | Histórico limitado, evita memory leak |
| Graceful Shutdown | SIGTERM/SIGINT handlers | Fechamento seguro em Railway/Render |

## ⍟ Camadas de Segurança

```text
[Request]
  → Helmet (CSP + security headers)
  → CORS (origin whitelist, método e header explícitos)
  → express.json({ limit: "64kb" }) — anti-DoS
  → authenticateToken (JWT verify + dev bypass logado)
  → createUserRateLimit (10/min free, 60/min premium via Redis)
  → checkQuota (ledger diário com try/catch)
  → Zod schema validation (todos os endpoints)
  → [Handler]
  → Global error handler (catch-all)
```
