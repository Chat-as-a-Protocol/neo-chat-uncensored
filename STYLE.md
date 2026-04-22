<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# NΞØ · STYLE GUIDE

```text
========================================
     NΞØ MELLØ · TECHNICAL STYLE
========================================
Status: ACTIVE
Version: v1.1.0
========================================
```

## ⟠ Language & Framework

- **Primary**: Javascript (ESM)
- **Style enforcement**: ESLint + Prettier
- **Config base**: `package.json` / `.eslintrc`
- **Frontend**: Astro v4+ (Islands Architecture)
- **Backend**: Node.js v20+ (Express)

────────────────────────────────────────

## ⨷ Naming Conventions

Padrões obrigatórios para nomes de símbolos e arquivos:

```text
┏━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━┓
┃ TIPO             ┃ PATTERN      ┃ EXEMPLO             ┃
┣━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━━━┫
┃ Components       ┃ PascalCase   ┃ ChatInterface.jsx   ┃
┃ Functions        ┃ camelCase    ┃ handleCheckout      ┃
┃ Constants        ┃ UPPER_SNAKE  ┃ API_URL             ┃
┃ Types/Interfaces ┃ PascalCase   ┃ UserTier            ┃
┃ Files            ┃ kebab-case   ┃ upgrade-page.astro  ┃
┗━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━┛
```

────────────────────────────────────────

## ⧉ File Organization

Estrutura modular e soberana para garantir isolamento técnico:

```text
src/
├── components/ # Componentes React/Astro (Atômicos)
├── layouts/    # Layouts base (Estrutural)
├── pages/      # Rotas e Pontos de Entrada (Astro)
└── store/      # Estado Global (Zustand)
```

────────────────────────────────────────

## ⟁ Core Principles

1. **Sovereignty**:
   Módulos devem ser independentes e evitar acoplamento lateral.
2. **Security**:
   Credenciais e segredos sempre via `.env`, nunca hardcoded.
3. **Clean Code**:
   Funções pequenas, puras e bem nomeadas.
4. **Git Flow**:
   Commits seguem o padrão Conventional Commits (feat, fix, chore, docs).

────────────────────────────────────────

## ⍟ Assinatura

```text
▓▓▓ NΞØ MELLØ
────────────────────────────────────────
Core Architect · NΞØ Protocol
neo@neoprotocol.space

"Code is law. Expand until
chaos becomes protocol."
────────────────────────────────────────
```
