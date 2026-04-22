<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# NΞØ · WORKSPACE MODEL

```text
========================================
       MODEL · NEO-CHAT-WORKSPACE
========================================
Status: ACTIVE
Version: v1.0.0
========================================
```

> **Model:** Multi-repo Sovereignty  
> **Philosophy:** Decentralized product, centralized orchestration.

## ⟠ Objetivo

Este workspace segue um modelo de coordenação centralizada para
repositórios de produtos independentes e soberanos.

- **Root**: Versiona apenas coordenação, padrões e infra global.
- **Filhos**: Versionam o código-fonte do produto e regras de negócio.
- **Isolation**: O root não captura nem versiona código dos filhos.

────────────────────────────────────────

## ⨷ Contrato de Operação

1. **Categorização**: Toda tarefa deve ser classificada como
    `Coordenação` (infra/docs/padrões) ou `Produto` (feature/bugfix).
2. **Escopo de Escrita**:
    - Se for coordenação, operar no diretório root.
    - Se for produto, operar dentro do diretório do repositório filho.
3. **Cross-Repo Changes**: Alterações que impactam múltiplos repos
    devem registrar o padrão no root antes da aplicação local.

────────────────────────────────────────

## ⧉ Manifestos

A fonte da verdade operacional reside nos manifestos estruturados:

- `manifests/workspace.json`: Metadados globais.
- `manifests/repos.json`: Inventário de repositórios soberanos.
- `manifests/integrations.json`: Contratos de integração observados.

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
