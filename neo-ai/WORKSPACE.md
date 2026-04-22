<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# NΞØ · WORKSPACE TOPOLOGY

```text
========================================
     TOPOLOGY · NEO-CHAT-UNCENSORED
========================================
Status: ACTIVE
Version: v1.0.0
========================================
```

> **Structure:** Monorepo (pnpm)  
> **Entry Point:** src/pages/index.astro  
> **Backend Port:** 3001

## ⧉ Monorepo Structure

```text
root/
├── frontend/          # Landing Page (Azure/Vercel)
├── backend/           # API & Core Logic (Railway)
├── src/               # Shared UI & Assets (Astro/React)
├── scripts/           # DevOps & Automation
└── neo-ai/            # Context Engineering & Docs
```

────────────────────────────────────────

## ⨷ Module Contracts

### **Frontend Module**
- **Function**: User Acquisition & Docs.
- **Port**: 4321 (Astro default).
- **Critical Envs**: `PUBLIC_API_URL`, `VENICE_API_KEY`.
- **Output**: Static Assets / Edge SSR.

### **Backend Module (chat-api-backend)**
- **Function**: Auth, Billing, Chat Logic.
- **Port**: 3001.
- **Critical Envs**: `STRIPE_SECRET`, `REDIS_URL`, `POSTGRES_URL`.
- **Boundary**: All logic must be behind JWT Auth.

────────────────────────────────────────

## ꙮ Shared Packages

```text
NAME            FUNCTION
────────────────────────────────────────────────────────────────────────
@neo/ui         Core Design System (React + Tailwind)
@neo/types      Global Type Definitions
@neo/utils      Common logic & Formatting
────────────────────────────────────────────────────────────────────────
```

────────────────────────────────────────

## ◬ Health Check

```bash
# Validar integridade do workspace
pnpm run check

# Verificar vulnerabilidades
pnpm audit
```

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
