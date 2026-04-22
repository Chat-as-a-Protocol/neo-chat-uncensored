#!/bin/bash

echo "🚀 Iniciando Sua Marca IA..."
echo ""

# Verificar se .env existe
if [ ! -f .env ]; then
  echo "⚠️  Criando .env a partir do exemplo..."
  cp .env.example .env
  echo "📝 Edite o arquivo .env com suas credenciais!"
  exit 1
fi

# Verificar se backend/.env existe
if [ ! -f backend/.env ]; then
  echo "⚠️  Criando backend/.env a partir do exemplo..."
  cp backend/.env.example backend/.env
  echo "📝 Edite o arquivo backend/.env com suas credenciais!"
fi

# Iniciar ecossistema via Makefile
echo "📦 Verificando dependências..."
make install

echo "🔌 Iniciando Frontend e Backend..."
make dev

echo ""
echo "✅ Sistema iniciado!"
echo "📖 Próximos passos:"
echo "   1. Obtenha sua API key em: https://venice.ai/settings/api"
echo "   2. Verifique seu .env: VENICE_API_KEY deve estar configurada"
echo "   3. Docs em: README.md"
