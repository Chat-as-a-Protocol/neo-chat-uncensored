# Guardrails for AI Agents

Default mode: READ-ONLY.

Before any code change, ask for explicit authorization.

Accepted authorization phrases:

- AUTORIZO ALTERAR CÓDIGO
- AUTORIZO APLICAR PATCH
- AUTORIZO CRIAR PR

Without authorization:

- do not edit files
- do not run write commands
- do not commit
- do not push
- do not open PR
- do not modify package files
- do not change migrations
- do not alter production config
