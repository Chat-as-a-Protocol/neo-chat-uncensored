<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# NØX · Frontend Module

```text
========================================
       NØX · FRONTEND NODE
========================================
Status: active
Runtime: Astro 6 SSR (Node standalone)
Domain: noxai.chat
Port: 4321 (Dev) / 8080 (Docker Container)
========================================
```

## ⟠ Papel & Arquitetura

O módulo **Frontend** é a interface de entrada pública do NØX servida sob o domínio `https://noxai.chat`.

- **Framework:** Astro 6 SSR em modo `standalone` com `@astrojs/node`.
- **Estilização:** Tailwind CSS + Vanilla CSS tokens.
- **Isolamento Client-Side:** Todas as chamadas para a API usam a variável pública `PUBLIC_API_URL` (`https://api.noxai.chat`).
- **Segurança de Variáveis:** `BACKEND_URL` é consumida **apenas** server-side pelo endpoint SSR `/health/deep` para pings de saúde na rede privada interna do Railway.

---

## ⧉ Estrutura do Nó

```text
frontend/
├── src/
│   ├── components/      # Componentes UI (Chat, Modal, Headers, Controls)
│   ├── layouts/         # Layout base da aplicação
│   ├── pages/           # Rotas SSR (chat, login, signup, upgrade, account, health)
│   └── styles/          # Estilos globais e tokens visuais
├── public/              # Favicon, banners, assets estáticos e SW PWA (sw.js)
├── astro.config.mjs     # Configuração do Astro SSR e integrações
├── tailwind.config.mjs  # Configuração Tailwind
├── tsconfig.json        # Configurações TypeScript
├── Dockerfile           # Imagem Node.js 22-slim para SSR
├── Makefile             # Interface canônica NΞØ Protocol
└── package.json         # Manifesto e dependências de UI
```

---

## ⨷ Comandos Canônicos

```bash
make dev      # Inicia servidor de desenvolvimento Astro em http://localhost:4321
make check    # Roda verificação de tipos e diagnósticos (astro check)
make build    # Gera o bundle de produção SSR em dist/
make preview  # Executa o preview local do build
make clean    # Limpa artefatos temporários (.astro e dist/)
```

---

## ⧖ Regras Operacionais

- **PWA Cache:** Incrementar a constante `CACHE_NAME` em `public/sw.js` após qualquer alteração em assets estáticos.
- **Deploy Railway:** Configurar o **Root Directory** como `/frontend` no dashboard do Railway.
