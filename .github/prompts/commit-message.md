<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# Commit Message Protocol · NØX

## ⟠ Regra

Use Conventional Commits.
Escreva em português direto.

O commit precisa explicar o contrato alterado,
não apenas listar arquivos.

────────────────────────────────────────

## ⧉ Tipos

- `feat:` nova capacidade
- `fix:` correção de bug
- `docs:` documentação
- `style:` formatação sem lógica
- `refactor:` reorganização sem novo comportamento
- `perf:` melhoria de performance
- `test:` cobertura de teste
- `chore:` manutenção

────────────────────────────────────────

## ⨷ Formato

```text
<tipo>(<escopo>): <descrição curta>

- O que mudou.
- Por que mudou.
- Qual contrato operacional foi preservado.
```

Exemplo:

```text
fix(flowpay): isola criação de cobrança em service seguro

- Centraliza chamadas para api.flowpay.cash.
- Rejeita respostas HTML e self-call para api.noxai.chat.
- Mantém checkout de tokens sem expor secrets no frontend.
```
