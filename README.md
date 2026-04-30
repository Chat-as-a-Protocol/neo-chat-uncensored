# Title: NØX.ai (Neo-Chat-Uncensored)

```text
========================================
     NØX.ai · PROCESSING ENGINE
========================================
```

![neo-chat-uncensored banner](./public/neo-chat-uncensored-banner.svg)

> **Version:** v2.0.0 (Processing Engine)  
> **Status:** Operational · Blasé Persona Ativa
> **Framework:** Astro 6.x / Node 22+
> **Protocol:** NΞØ Nexus / FlowPay

## ⟠ Objetivo

Interface soberana e minimalista para processamento de modelos de IA sem censura.
A NØX.ai opera como uma engine técnica, removendo verniz social e focando em saída bruta de dados.

O sistema utiliza arquitetura Astro 6 nativa, garantindo performance instantânea,
integridade de contexto e comunicação via SSE (Server-Sent Events).

────────────────────────────────────────

## ⧉ Arquitetura

O ecossistema é uma implementação canônica do NΞØ Protocol, utilizando FlowPay como gateway único e Nexus como barramento de eventos.

```text
▓▓▓ SYSTEM TOPOLOGY
────────────────────────────────────────
└─ Root (Astro 6.x)
   ├─ src/pages/ (Static Routes)
   ├─ src/components/ (Astro/Vanilla Components)
   └─ public/ (Static Assets & Logo)

└─ Backend (Express/Node.js)
   ├─ src/server.js (Core Logic)
   └─ .env (Sensitive Context)
────────────────────────────────────────
```

### 1. Frontend (Astro)

Componentização baseada em Astro e scripts Vanilla JS.
Utiliza Server-Sent Events (SSE) para streaming de tokens em tempo real.
Design System: Glassmorphism / Cyberpunk (Tailwind CSS puro).

### 2. Backend (Proxy)

Gateway seguro para a Venice AI API.
Gerenciamento de rate limiting, quotas diárias e integração com Stripe.
Bypass de autenticação em modo desenvolvimento para agilidade operacional.

────────────────────────────────────────

## ⨷ Comandos

Todos os comandos devem ser executados via `pnpm` para garantir consistência do lockfile.

```bash
# Inicializar ambiente e dependências
make install

# Iniciar ecossistema completo (FE + BE)
make dev

# Auditoria de segurança e integridade
make audit
make verify

# Build de produção
make build
```

────────────────────────────────────────

## ⍟ Segurança

- **Zero Bloat**: Removido Framer Motion, Zustand e React-Three-Fiber.
- **Privacy First**: Chaves de API nunca tocam o cliente; processamento via proxy.
- **Context Engineering**: Manifestos de integridade em `docs/CONTEXT.md`.

────────────────────────────────────────

```text
▓▓▓ NΞØ MELLØ
────────────────────────────────────────
Core Architect · NΞØ Protocol
neo@neoprotocol.space

"Code is law. Expand until
chaos becomes protocol."

Security by design.
Exploits find no refuge here.
────────────────────────────────────────
```
