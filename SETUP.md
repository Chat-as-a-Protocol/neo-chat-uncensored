# Setup & Technical Documentation - NØX.AI

```text
========================================
     NØX.AI · TECHNICAL PROTOCOL
========================================
```

Este documento detalha a infraestrutura, comandos e configurações necessárias para operar a engine NØX.AI.

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

> **IMPORTANTE**: Este projeto utiliza **Astro SSR (output: server)**. O build gera arquivos que devem ser executados por um runtime Node.js, não sendo compatível com hosts estáticos puros.

```bash
# 1. Inicializar ambiente e instalar dependências
make install

# 2. Iniciar ecossistema completo (Frontend SSR + Backend Express)
make dev

# 3. Qualidade e Segurança (Obrigatório antes do push)
make check  # Roda verify + audit + lint + tests

# 4. Build de produção (Astro SSR entrypoint em dist/server/entry.mjs)
make build
```

## 🚀 Infraestrutura e Deploy (Railway)

O deploy é orquestrado pelo arquivo `railway.json`. Regras críticas de manutenção:

1.  **Health Check**: A rota canônica de saúde é `/health`. **NUNCA** use `/` no Railway, pois os redirecionamentos de autenticação do SSR (302) farão o health check falhar.
2.  **Variáveis de Ambiente**: Certifique-se de que `JWT_SECRET`, `FLOWPAY_API_KEY` e `REDIS_URL` estejam configuradas no painel do Railway.
3.  **Start Command**: O comando de inicialização é `node dist/server/entry.mjs`.

### **Arquitetura de Faturamento**
- **Tiktoken**: O sistema utiliza o encoder `cl100k_base`. Mudanças no modelo de IA exigem validação de tokens no `backend/src/utils/billing.js`.
- **Tiers**: Os únicos tiers válidos no sistema são `free` e `pro`. O uso de `premium` é automaticamente normalizado para `pro` no runtime.

### **Frontend (Astro SSR)**

O frontend é servido como arquivos estáticos após o build.

* **Comando**: `serve dist -l $PORT`
* **Dependência**: Requer `serve` instalado globalmente ou via `npx`.

### **Backend (Express)**

O backend opera como um proxy seguro para APIs externas e gerenciamento de usuários.

* **Comando**: `cd backend && node src/server.js`
* **Porta**: `$PORT` (Padrão Railway) ou `3001`.

## ⚙️ Variáveis de Ambiente (.env)

Consulte `.env.example` e `backend/.env.example` para a lista completa. As principais são:

* `PUBLIC_API_URL`: URL pública do seu backend (ex: `https://api.seusite.com`).
* `FRONTEND_URL`: URL do seu frontend para liberação de CORS.
* `VENICE_API_KEY`: Chave de API da Venice.ai.
* `FLOWPAY_WEBHOOK_SECRET`: Segredo para validação de pagamentos.

## 🛡️ Segurança

* **Proxy-Only**: Chaves de API nunca são expostas ao frontend.
* **Timing-Safe Auth**: Verificações de senha e assinatura de webhook usam `crypto.timingSafeEqual`.
* **SHA-256 IDs**: Identificação de usuários baseada em hashes determinísticos e unidirecionais.
* **Idempotency**: Webhooks processados com travas no Redis para evitar crédito duplicado.

## 🔍 Comandos de Inspeção e Debug

Para inspecionar Pull Requests automatizados (ex: Railway bots e atualizações de infraestrutura):

```bash
gh pr view 8 --json number,title,state,mergeStateStatus,headRefName,baseRefName,isDraft,url,author,files,commits
```

---
Para visão geral do projeto, consulte [README.md](./README.md).
