#!/usr/bin/env bash
# Bateria da demo contra o gateway: 401, 200, 400, 201, 409, 404 e 503.
# Uso: scripts/demo-curl.sh                 (local: reseta os bancos e testa o 503)
#      scripts/demo-curl.sh http://IP:3000  (remoto: sem reset e sem 503)
set -uo pipefail
cd "$(dirname "$0")/.."

LOCAL=1
[ -n "${1:-}" ] && LOCAL=0
API="${1:-http://localhost:3000}/api/v1"
SENHA="${APP_PASSWORD:-sd2026}"
CORPO=$(mktemp)
trap 'rm -f "$CORPO"' EXIT

passo() { printf '\n\033[1m== %s\033[0m  (esperado: %s)\n' "$1" "$2"; }

req() {
  local metodo=$1 rota=$2 dados=${3:-} token=${4:-} chave=${5:-}
  local args=(-s -o "$CORPO" -w '%{http_code}' -X "$metodo" "$API$rota" -H 'Content-Type: application/json')
  [ -n "$dados" ] && args+=(-d "$dados")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  [ -n "$chave" ] && args+=(-H "Idempotency-Key: $chave")
  local codigo
  codigo=$(curl "${args[@]}")
  printf 'HTTP %s  ' "$codigo"
  jq -c 'if type == "object" then del(.access_token) else . end' "$CORPO" 2>/dev/null || cat "$CORPO"
}

login() {
  curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
    -d "{\"usuario\":\"$1\",\"senha\":\"$SENHA\"}" | jq -r .access_token
}

if [ $LOCAL -eq 1 ]; then
  scripts/reset-demo.sh >/dev/null
  echo "(bancos resetados para o estado inicial da demo)"
fi

passo "1. GET /turmas sem token" 401
req GET /turmas

passo "2. GET /turmas com token inválido" 401
req GET /turmas "" "token-invalido"

passo "3. Login com senha errada" 401
req POST /auth/login '{"usuario":"2021001","senha":"errada"}'

passo "4. Login de 2021001" 200
req POST /auth/login "{\"usuario\":\"2021001\",\"senha\":\"$SENHA\"}"
ANA=$(login 2021001)
BRUNO=$(login 2021002)

passo "5. GET /turmas com token" 200
req GET /turmas "" "$ANA"

passo "6. POST /matriculas com codigo_turma vazio" 400
req POST /matriculas '{"codigo_turma":""}' "$ANA"

passo "7. POST /matriculas com campo extra" 400
req POST /matriculas '{"codigo_turma":"SD-2026-1","matricula_aluno":"2021003"}' "$ANA"

passo "8. Mesmo corpo inválido, mas SEM token (Guard antes do Pipe)" 401
req POST /matriculas '{"codigo_turma":""}'

CHAVE=$(cat /proc/sys/kernel/random/uuid)
passo "9. 2021001 em SD-2026-1" "201 DEFERIDA"
req POST /matriculas '{"codigo_turma":"SD-2026-1"}' "$ANA" "$CHAVE"

passo "10. Repetição com a MESMA Idempotency-Key" "201, mesmo protocolo"
req POST /matriculas '{"codigo_turma":"SD-2026-1"}' "$ANA" "$CHAVE"

passo "11. Novo pedido de 2021001 em SD-2026-1" "409 já matriculado"
req POST /matriculas '{"codigo_turma":"SD-2026-1"}' "$ANA"

passo "12. 2021002 em SD-2026-1" "201 INDEFERIDA_PRE_REQUISITO"
req POST /matriculas '{"codigo_turma":"SD-2026-1"}' "$BRUNO"

passo "13. 2021001 em BD-2026-1 (lotada)" "201 INDEFERIDA_SEM_VAGA"
req POST /matriculas '{"codigo_turma":"BD-2026-1"}' "$ANA"

passo "14. Turma inexistente" 404
req POST /matriculas '{"codigo_turma":"XYZ-2026-1"}' "$ANA"

passo "15. Minhas matrículas (2021001)" 200
req GET /matriculas "" "$ANA"

if [ $LOCAL -eq 1 ]; then
  # Num host de pé com o processo parado a conexão é recusada (503). No compose
  # local o container some da rede e só a deadline encerra a chamada (504).
  passo "16. registro-service parado" "503 (VMs) ou 504 (compose local), sem travar"
  docker compose stop registro-service >/dev/null 2>&1
  req GET /turmas "" "$ANA"
  docker compose start registro-service >/dev/null 2>&1
  echo "(registro-service religado)"
fi
