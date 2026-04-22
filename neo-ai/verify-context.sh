#!/bin/bash
# Valida se o contexto está pronto para consumo por agents

set -e

echo "🔎 Verificando integridade do contexto..."

# 1. Busca por placeholders {{...}} ignorando o próprio script, scripts/ e templates de TASKS
PLACEHOLDERS=$(grep -rE "\{\{[A-Z0-9_]+\}\}" neo-ai/ ARCHITECTURE.md STYLE.md --exclude="verify-context.sh" --exclude-dir="scripts" --exclude-dir="TASKS" || true)

if [ ! -z "$PLACEHOLDERS" ]; then
  echo "❌ ERRO: Foram encontrados placeholders não preenchidos:"
  echo "$PLACEHOLDERS"
  exit 1
fi

# 2. Verificação de existência de arquivos fundamentais
FILES=(
  "neo-ai/CONTEXT.md"
  "neo-ai/CONSTRAINTS.md"
  "neo-ai/WORKSPACE.md"
  "ARCHITECTURE.md"
  "STYLE.md"
)

for file in "${FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ ERRO: Arquivo crítico de contexto faltando: $file"
    exit 1
  fi
done

echo "✅ Contexto validado com sucesso!"
