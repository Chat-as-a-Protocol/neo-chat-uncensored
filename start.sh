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

# Subir serviços
docker-compose up --build

echo ""
echo "✅ Frontend: http://localhost:4321"
echo "✅ Backend API: http://localhost:3001"
echo ""
echo "📖 Próximos passos:"
echo "   1. Obtenha sua API key em: https://venice.ai/settings/api"
echo "   2. Adicione ao .env: VENICE_API_KEY=sua_chave"
echo "   3. Configure Stripe webhooks para /webhooks/stripe"