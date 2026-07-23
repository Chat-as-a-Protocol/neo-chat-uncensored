<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# NØX · Backend Module

```text
========================================
       NØX · BACKEND API NODE
========================================
Status: active
Runtime: Node.js 22 + Express API
Internal Network: backend.railway.internal:3001
Public Access: via Nginx WAF (api.noxai.chat)
========================================
```

## ⟠ Papel & Arquitetura

O módulo **Backend** contém a API soberana do ecossistema NØX. Ele opera inteiramente dentro da rede privada do Railway e gerencia autenticação, faturamento auditado via Ledger, integração com LLM e processamento de webhooks.

- **Identidade Pura (JWT):** Autenticação stateless via JWT de identidade (`userId`). Autorizações e quotas são resolvidas dinamicamente via Postgres HA e Redis.
- **Faturamento Auditável (Ledger):** Todo consumo da API Venice LLM é debitado em blocos `try/finally` com garantia de concorrência e idempotência.
- **Webhooks Hardened:** Rota `POST /api/webhooks/flowpay` com assinatura obrigatória HMAC-SHA256 (`X-Nexus-Signature` / `X-FlowPay-Signature`).
- **CORS Seguro (Manual):** Proibido usar bibliotecas de terceiros como `cors`. Permissão injetada via middleware manual validando origens com `includes("noxai.chat")`.

---

## ⧉ Estrutura do Nó

```text
backend/
├── src/
│   ├── middleware/      # Security, CORS, Auth, Rate-limiting, Anti-bot
│   ├── routes/          # API Endpoints (auth, chat, ledger, webhooks, health)
│   ├── services/        # Venice LLM proxy, FlowPay PIX, Resend Mail
│   └── server.js        # Entrypoint Express API (:3001)
├── schema.sql           # Schema idempotente Postgres HA
├── Dockerfile           # Imagem Node.js 22-slim
├── Makefile             # Interface canônica NΞØ Protocol
└── package.json         # Manifesto e dependências de API
```

---

## ⨷ Comandos Canônicos

```bash
make dev      # Inicia a API Express na porta :3001
make check    # Roda validação de sintaxe (node --check src/server.js)
make test     # Executa a suíte de testes automatizados
make migrate  # Aplica o schema.sql no banco Postgres HA via cliente pg
make clean    # Limpa artefatos e relatórios temporários
```

---

## ⧖ Regras Operacionais

- **Deploy Railway:** Configurar o **Root Directory** como `/backend` no dashboard do Railway.
- **Cache DNS Nginx:** Sempre reiniciar o serviço `nginx-WAF` no Railway após qualquer deploy do backend para atualizar a resolução de IP interno (`backend.railway.internal`).
