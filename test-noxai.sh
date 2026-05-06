#!/bin/bash

echo "=== TESTE DE CONECTIVIDADE NOXAI.CHAT ==="
echo ""

# 1. Teste do Backend Health
echo "1️⃣  Testando Backend Health..."
curl -s -w "\nStatus: %{http_code}\n" https://api.noxai.chat/health
echo ""

# 2. Teste de CORS (simulando requisição do frontend)
echo "2️⃣  Testando CORS Headers..."
curl -s -i -X OPTIONS https://api.noxai.chat/api/chat \
  -H "Origin: https://noxai.chat" \
  -H "Access-Control-Request-Method: POST" | head -20
echo ""

# 3. Teste de autenticação guest
echo "3️⃣  Testando Auth Guest..."
curl -s -X POST -w "\nStatus: %{http_code}\n" https://api.noxai.chat/api/auth/guest
echo ""

# 4. Teste de usage (requer token, vai falhar sem auth)
echo "4️⃣  Testando Usage Endpoint..."
curl -s -w "\nStatus: %{http_code}\n" https://api.noxai.chat/api/usage \
  -H "Authorization: Bearer test"
echo ""

# 5. Teste do Frontend
echo "5️⃣  Testando Frontend..."
curl -s -w "\nStatus: %{http_code}\n" https://noxai.chat | head -50
echo ""

# 6. Teste de DNS
echo "6️⃣  Testando DNS Resolution..."
nslookup api.noxai.chat
echo ""
nslookup noxai.chat
echo ""

# 7. Teste de latência
echo "7️⃣  Testando Latência..."
curl -w "Tempo total: %{time_total}s\nTempo connect: %{time_connect}s\nTempo TTFB: %{time_starttransfer}s\n" \
  -o /dev/null -s https://api.noxai.chat/health
echo ""

echo "=== FIM DOS TESTES ==="
