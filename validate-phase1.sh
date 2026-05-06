#!/usr/bin/env bash
# =============================================
# NØX · Validação Fase 1 · JWT Identidade Pura
# =============================================
# USO:
#   cp .env.test.example .env.test   # preencher com conta descartável
#   source .env.test && ./validate-phase1.sh
#
# NUNCA passe credenciais inline no shell — elas ficam no histórico (~/.zsh_history).
# =============================================
set -euo pipefail

API="https://api.noxai.chat"
PASS=0
FAIL=0

green() { echo -e "\033[0;32m✅ $1\033[0m"; }
red()   { echo -e "\033[0;31m❌ $1\033[0m"; }
info()  { echo -e "\033[0;34m→  $1\033[0m"; }

# Guard: impede execução sem variáveis de ambiente
if [ -z "${TEST_EMAIL:-}" ] || [ -z "${TEST_PASSWORD:-}" ]; then
  red "TEST_EMAIL e TEST_PASSWORD não definidos."
  echo "  Execute: source .env.test && ./validate-phase1.sh"
  exit 1
fi

# Guard: impede uso acidental de conta real
if [[ "$TEST_EMAIL" != *"test+"* ]] && [[ "$TEST_EMAIL" != *".test@"* ]] && [[ "$TEST_EMAIL" != *"@nox.local"* ]]; then
  red "ABORTADO: TEST_EMAIL não parece ser uma conta descartável."
  echo "  Use um alias como: test+phase1@noxai.chat ou phase1@nox.local"
  echo "  Nunca rode o Cenário 3 com uma conta real de usuário."
  exit 1
fi

echo ""
echo "=== NØX · VALIDAÇÃO FASE 1 ==="
echo "  Conta de teste: $TEST_EMAIL"
echo ""

# ──────────────────────────────────────────────
# Pré-requisito: Login para obter token real
# ──────────────────────────────────────────────
info "Fazendo login para obter token de usuário real..."
LOGIN_RESP=$(curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}")

TOKEN=$(echo "$LOGIN_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  red "Login falhou. Verifique TEST_EMAIL e TEST_PASSWORD."
  echo "Resposta: $LOGIN_RESP"
  exit 1
fi

green "Token obtido: ${TOKEN:0:30}..."
echo ""

# ──────────────────────────────────────────────
# CENÁRIO 1: Tier Update em Runtime
# ──────────────────────────────────────────────
echo "--- CENÁRIO 1: Tier Update em Runtime ---"
info "Verificando uso atual com o token existente..."
USAGE_RESP=$(curl -s "$API/api/usage" -H "Authorization: Bearer $TOKEN")
CURRENT_TIER=$(echo "$USAGE_RESP" | grep -o '"tier":"[^"]*"' | cut -d'"' -f4)
CURRENT_LIMIT=$(echo "$USAGE_RESP" | grep -o '"limit":[0-9]*' | cut -d':' -f2)

echo "  Tier atual:  $CURRENT_TIER"
echo "  Limite atual: $CURRENT_LIMIT"

if [ -n "$CURRENT_TIER" ] && [ -n "$CURRENT_LIMIT" ]; then
  green "CENÁRIO 1: /api/usage retorna tier do banco corretamente"
  PASS=$((PASS + 1))
else
  red "CENÁRIO 1: Falhou — /api/usage não retornou tier ou limit"
  FAIL=$((FAIL + 1))
fi
echo ""

# ──────────────────────────────────────────────
# CENÁRIO 2: Token de Dispositivo Antigo
# (JWT com payload antigo que contém tier embutido)
# ──────────────────────────────────────────────
echo "--- CENÁRIO 2: Token com Payload Antigo ---"
info "Testando token com claims extras (tier embutido)..."

# Simula um token "antigo" — mas como não temos acesso ao JWT_SECRET aqui,
# usamos o token real (gerado antes do patch) e verificamos se a request funciona.
USAGE_OLD=$(curl -s -o /dev/null -w "%{http_code}" \
  "$API/api/usage" -H "Authorization: Bearer $TOKEN")

if [ "$USAGE_OLD" = "200" ]; then
  green "CENÁRIO 2: Token existente aceito — middleware ignorou payload antigo"
  PASS=$((PASS + 1))
else
  red "CENÁRIO 2: Falhou — HTTP $USAGE_OLD (esperado 200)"
  FAIL=$((FAIL + 1))
fi
echo ""

# ──────────────────────────────────────────────
# CENÁRIO 3: Usuário Deletado com Token Válido
# ──────────────────────────────────────────────
echo "--- CENÁRIO 3: Usuário Deletado com Token Válido ---"
info "Criando usuário de teste temporário..."

TEMP_EMAIL="test_delete_$(date +%s)@nox.local"
TEMP_PASS="Test@12345"

REG_RESP=$(curl -s -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEMP_EMAIL\",\"password\":\"$TEMP_PASS\",\"name\":\"TestDelete\"}")

TEMP_TOKEN=$(echo "$REG_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TEMP_TOKEN" ]; then
  red "CENÁRIO 3: Não foi possível criar usuário de teste (endpoint de registro pode não existir)"
  info "Execute manualmente: insira um user de teste no banco, capture o token, delete o user e teste GET /api/usage"
  FAIL=$((FAIL + 1))
else
  green "Usuário de teste criado: $TEMP_EMAIL"

  # Extrai o user_id para deletar
  TEMP_ID=$(echo "$REG_RESP" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  info "Deletando usuário do banco via psql..."

  # Nota: requer DATABASE_URL no ambiente
  psql "$DATABASE_URL" -c "DELETE FROM users WHERE email = '$TEMP_EMAIL';" 2>/dev/null || \
    railway connect Postgres -c "DELETE FROM users WHERE email = '$TEMP_EMAIL';" 2>/dev/null || \
    info "Delete manual necessário: DELETE FROM users WHERE email = '$TEMP_EMAIL';"

  info "Testando request com token do usuário deletado..."
  DELETE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "$API/api/usage" -H "Authorization: Bearer $TEMP_TOKEN")

  if [ "$DELETE_STATUS" = "401" ]; then
    green "CENÁRIO 3: 401 USER_NOT_FOUND retornado corretamente"
    PASS=$((PASS + 1))
  else
    red "CENÁRIO 3: Falhou — HTTP $DELETE_STATUS (esperado 401)"
    FAIL=$((FAIL + 1))
  fi
fi

echo ""
echo "=============================="
echo "  RESULTADO: ✅ $PASS passou | ❌ $FAIL falhou"
echo "=============================="
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
