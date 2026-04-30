# Setup & Technical Documentation - NØX.ai

```text
========================================
     NØX.ai · TECHNICAL PROTOCOL
========================================
```

Este documento detalha a infraestrutura, comandos e configurações necessárias para operar a engine NØX.ai.

## ⧉ Arquitetura (Topology)

O ecossistema utiliza uma estrutura de monorepo pnpm com um frontend estático (Astro) e um backend proxy (Express).

```text
▓▓▓ SYSTEM TOPOLOGY
────────────────────────────────────────
└─ Root (Astro 6.x - Frontend)
   ├─ src/             (Componentes e Páginas)
   ├─ public/          (Assets Estáticos)
   └─ Dockerfile       (Build de Produção FE)

└─ Backend (Node.js - API/Proxy)
   ├─ src/server.js    (Lógica Core e Segurança)
   └─ Dockerfile       (Build de Produção BE)
────────────────────────────────────────
```

## ⨷ Comandos de Desenvolvimento

Todos os comandos devem ser executados via `pnpm` através do `Makefile` raiz para garantir a integridade do ambiente.

```bash
# 1. Inicializar ambiente e instalar dependências em todos os pacotes
make install

# 2. Iniciar ecossistema completo localmente (Frontend + Backend)
make dev

# 3. Auditoria de segurança e integridade
make audit
make verify

# 4. Build de produção (gera a pasta dist/)
make build
```

## 🚀 Comandos de Produção (Runtime)

Abaixo estão os comandos reais executados dentro dos containers em produção (Railway/Docker):

### **Frontend (Astro)**
O frontend é servido como arquivos estáticos após o build.
*   **Comando**: `serve dist -l $PORT`
*   **Dependência**: Requer `serve` instalado globalmente ou via `npx`.

### **Backend (Express)**
O backend opera como um proxy seguro para APIs externas e gerenciamento de usuários.
*   **Comando**: `cd backend && node src/server.js`
*   **Porta**: `$PORT` (Padrão Railway) ou `3001`.

## ⚙️ Variáveis de Ambiente (.env)

Consulte `.env.example` e `backend/.env.example` para a lista completa. As principais são:

- `PUBLIC_API_URL`: URL pública do seu backend (ex: `https://api.seusite.com`).
- `FRONTEND_URL`: URL do seu frontend para liberação de CORS.
- `VENICE_API_KEY`: Chave de API da Venice.ai.
- `FLOWPAY_WEBHOOK_SECRET`: Segredo para validação de pagamentos.

## 🛡️ Segurança

- **Proxy-Only**: Chaves de API nunca são expostas ao frontend.
- **Timing-Safe Auth**: Verificações de senha e assinatura de webhook usam `crypto.timingSafeEqual`.
- **SHA-256 IDs**: Identificação de usuários baseada em hashes determinísticos e unidirecionais.
- **Idempotency**: Webhooks processados com travas no Redis para evitar crédito duplicado.

---
Para visão geral do projeto, consulte [README.md](./README.md).
