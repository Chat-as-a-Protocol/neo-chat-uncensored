<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# Skill

```text
========================================
          NØX · DEV SKILL
========================================
Use when editing this repository.
========================================
```

## ⟠ Workflow

1. Ler `AGENTS.md`, `CONTEXT.md`, `MEMORY.md` e este arquivo.
2. Confirmar estado real com `rg`, `git status` e arquivos de config.
3. Fazer a menor mudança coerente.
4. Validar com comandos locais.
5. Atualizar docs quando contrato, rota, domínio ou env mudar.

────────────────────────────────────────

## ⧉ Frontend

Prioridade mobile.

Evitar:

- efeitos pesados que só ajudam desktop
- card dentro de card
- copy longa em superfícies compactas
- fallback antigo para domínio Railway

Preservar:

- identidade visual NØX
- leitura rápida
- botões claros
- rotas legais obrigatórias

────────────────────────────────────────

## ⨷ Backend

Preservar boundaries:

```text
frontend -> api.noxai.chat
backend  -> api.flowpay.cash
backend  -> api.resend.com
backend  -> Venice
```

Todo erro externo deve falhar de forma segura,
sem vazar secrets e sem quebrar JSON inesperado.

────────────────────────────────────────

## ⍟ Validação

```bash
fnm exec --using v25.9.0 pnpm check
fnm exec --using v25.9.0 pnpm build
fnm exec --using v25.9.0 pnpm --filter chat-api-backend test
git diff --check
```
