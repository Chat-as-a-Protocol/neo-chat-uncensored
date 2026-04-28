<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# NΞØ · CONSTRAINTS & GUARDRAILS

```text
========================================
     RESTRICTIONS · NEO-CHAT-UNCENSORED
========================================
Status: ACTIVE
Version: v1.0.0
========================================
```

> **Runtime:** Node.js v20.x (LTS)  
> **Secrets:** Environment Variables Only  
> **Audit:** Mandatory `pnpm audit` before Merge

## ⨷ Technical Non-Negotiables

1. **Runtime**: Node.js v20.x (LTS). Mudanças requerem RFC
    em `neo-ai/CHANGELOG.md`.
2. **Dependencies**: Auditoria obrigatória via `pnpm audit`.
    Não adicionar pacotes sem validação de licença e segurança.
3. **API Versioning**: Breaking changes proibidas em produção.
    Use versionamento por path (`/v1/`) ou header.
4. **Security**: Proibido armazenamento de chaves de API
    ou credenciais em código-fonte.

────────────────────────────────────────

## ⟁ Architectural Boundaries

**Frontend (Landing/Docs)**
Deve ser estático ou SSG (Astro).
Proibido acesso direto a bancos de dados ou Redis.
Comunicação externa apenas via Serverless/Edge Functions.

**Dashboard & App**
Comunicação isolada via Backend API.
Autenticação obrigatória em todos os endpoints sensíveis.

**Data Sovereignty**
Logs de chat devem ser anonimizados ou criptografados.
O usuário deve ter opção de apagar todo o histórico (Purge).

────────────────────────────────────────

## ⨀ Forbidden (Explicit List)

- **Frameworks CSS**: Proibido Bootstrap, Material UI ou Bulma.
  Use Tailwind CSS ou CSS Vanilla.
- **ORM**: Evitar Prisma em caminhos críticos de performance.
  Preferir SQL puro ou `postgres.js`.
- **Auth**: Proibido senhas em plain text.
  Uso obrigatório de `bcryptjs` com rounds >= 12.
- **Hardcoding**: Proibido hardcoding de URLs de ambiente.
  Use constantes e variáveis de ambiente.

────────────────────────────────────────

## ⧖ Decision Log

```text
ID     DECISION                             RATIONALE
────────────────────────────────────────────────────────────────────────
001    Astro Hybrid                         Balance between SEO & App
002    Venice AI Primary                    Uncensored & Privacy priority
003    Redis Quotas                         DDoS protection & Tiering
────────────────────────────────────────────────────────────────────────
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
