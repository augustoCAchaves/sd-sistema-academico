#!/usr/bin/env bash
# 10 alunos disputam ao mesmo tempo a ÚLTIMA vaga da SO-2026-1 (29/30 no seed).
# Esperado: exatamente 1 DEFERIDA, 9 INDEFERIDA_SEM_VAGA e a turma em 30/30.
# Uso: scripts/concorrencia.sh [URL do gateway]   (rode scripts/reset-demo.sh antes)
set -euo pipefail
API="${1:-http://localhost:3000}/api/v1"
SENHA="${APP_PASSWORD:-sd2026}"
TURMA=SO-2026-1
SAIDA=$(mktemp -d)
trap 'rm -rf "$SAIDA"' EXIT

alunos=$(seq 2021004 2021013)
for a in $alunos; do
  curl -sf -X POST "$API/auth/login" -H 'Content-Type: application/json' \
    -d "{\"usuario\":\"$a\",\"senha\":\"$SENHA\"}" | jq -r .access_token > "$SAIDA/$a.token"
done
echo "10 logins ok. Disparando 10 pedidos simultâneos para $TURMA..."

for a in $alunos; do
  curl -s -o "$SAIDA/$a.json" -w '%{http_code}' -X POST "$API/matriculas" \
    -H "Authorization: Bearer $(cat "$SAIDA/$a.token")" -H 'Content-Type: application/json' \
    -H "x-correlation-id: corrida-$a" -d "{\"codigo_turma\":\"$TURMA\"}" > "$SAIDA/$a.http" &
done
wait

for a in $alunos; do
  printf '%s  HTTP %s  %s\n' "$a" "$(cat "$SAIDA/$a.http")" "$(jq -r '.status // .mensagem' "$SAIDA/$a.json")"
done
echo
cat "$SAIDA"/*.json | jq -r '.status // "ERRO"' | sort | uniq -c
TOKEN=$(cat "$SAIDA/2021004.token")
curl -s "$API/turmas/$TURMA" -H "Authorization: Bearer $TOKEN" | jq -r '"\(.codigo_turma): \(.vagas_ocupadas)/\(.vagas_totais) ocupadas"'
