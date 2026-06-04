#!/bin/bash

echo "=== INICIANDO TESTE DE ESTRESSE NØX ==="
echo "1. Criando sessão de Guest..."
GUEST_RESPONSE=$(curl -s -X POST https://api.noxai.chat/api/auth/guest)
TOKEN=$(echo $GUEST_RESPONSE | grep -oE '"token":"[^"]+"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Erro ao obter token de guest. Abortando."
    echo "Resposta: $GUEST_RESPONSE"
    exit 1
fi

echo "✅ Token obtido: ${TOKEN:0:20}..."

echo ""
echo "2. Enviando mensagem de chat (Simulando Streaming)..."
echo "Pergunta: 'Explique o protocolo NØX em 3 parágrafos.'"
echo "----------------------------------------------------"

# Medindo tempo e capturando stream
START_TIME=$(date +%s)
curl -N -X POST https://api.noxai.chat/api/chat \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"messages": [{"role": "user", "content": "Oi"}]}' \
     --no-buffer

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "----------------------------------------------------"
echo "✅ Teste finalizado em ${DURATION}s"

if [ $DURATION -lt 2 ]; then
    echo "⚠️  Aviso: Resposta rápida demais. Verifique se não houve erro de cota ou rede."
fi

echo "=== FIM DO ESTRESSE ==="
