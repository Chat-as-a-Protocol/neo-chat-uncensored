<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->

```text
========================================
   NEO-CHAT-UNCENSORED · ARCHITECTURE
========================================
```

## ⟠ Topologia

```text
Browser
  └─ Astro 6 (output: static)
       ├─ /            → AstroChatInterface (streaming SSE)
       ├─ /login       → formulário + JWT storage
       ├─ /signup      → cadastro + auto-login
       ├─ /upgrade     → planos + checkout FlowPay
       └─ /success     → confirmação pós-pagamento

API Backend (Express / Railway)
  ├─ POST /api/chat           → proxy Venice AI (SSE stream)
  ├─ GET  /api/models         → lista modelos Venice
  ├─ GET  /api/usage          → quota diária do usuário
  ├─ POST /api/auth/login     → JWT (bcrypt verify)
  ├─ POST /api/auth/signup    → bcrypt hash + JWT
  ├─ POST /flowpay/create-charge → checkout FlowPay (Fase 2)
  └─ POST /webhooks/flowpay   → consumer Nexus (Fase 2)

Redis (Railway ou mock in-memory em dev)
  ├─ tier:{userId}            → "free" | "premium" (TTL 30d)
  ├─ limit:{userId}           → tokens/dia permitidos
  ├─ usage:{userId}:{date}    → tokens usados hoje
  └─ password:{userId}        → bcrypt hash da senha

Venice AI
  └─ POST /api/v1/chat/completions (SSE stream)
```

## ⧉ Fluxo de Dados — Chat

```text
1. Usuário digita mensagem
2. Frontend envia POST /api/chat com Bearer token
3. Backend: authenticateToken → checkQuota → createUserRateLimit
4. Backend proxy para Venice API (SSE)
5. Backend faz pipe do stream direto para o cliente
6. Frontend renderiza chunks incrementalmente
7. Backend incrementa quota no Redis (assíncrono)
```

## ⧇ Fluxo de Pagamento (Fase 2 — FlowPay)

```text
1. Usuário clica "Fazer Upgrade"
2. Frontend: POST /flowpay/create-charge → retorna URL
3. Usuário completa pagamento em flowpay.cash
4. FlowPay emite FLOWPAY:PAYMENT_RECEIVED para Nexus
5. Nexus entrega POST /webhooks/flowpay (X-Nexus-Signature)
6. Backend valida HMAC e atualiza tier:userId → "premium"
```

## ◬ Decisões de Arquitetura

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Frontend | Astro static | Performance extrema, sem JS desnecessário |
| Streaming | SSE nativo | Compatível com Venice, sem WebSocket |
| Auth | JWT + Redis | Sem banco de dados no MVP |
| Pagamentos | FlowPay via Nexus | Padrão canônico do ecossistema NEO |
| Dev local | Redis mock in-memory | Zero dependências de infraestrutura |
