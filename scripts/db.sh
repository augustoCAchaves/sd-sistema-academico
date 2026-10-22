#!/usr/bin/env bash
# SELECTs da demo nos bancos que estiverem rodando neste host (na VM, só o dela).
# Uso: scripts/db.sh [registro|matricula]   (sem argumento: os dois)
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] && set -a && . ./.env && set +a
USUARIO=${POSTGRES_USER:-academico}
RODANDO=$(docker compose ps --services --status running)

consultar() {
  local servico=$1 banco=$2 titulo=$3 sql=$4
  if ! grep -qx "$servico" <<<"$RODANDO"; then
    printf '\n(%s não está rodando neste host)\n' "$servico"
    return
  fi
  printf '\n\033[1m== %s (%s)\033[0m\n' "$titulo" "$banco"
  docker compose exec -T "$servico" psql -U "$USUARIO" -d "$banco" -P pager=off -c "$sql"
}

if [ "${1:-registro}" != matricula ]; then
  consultar postgres-registro registro_db "Vagas por turma" \
    "SELECT codigo, vagas_ocupadas, vagas_totais, vagas_totais - vagas_ocupadas AS livres FROM turmas ORDER BY codigo;"
fi
if [ "${1:-matricula}" != registro ]; then
  consultar postgres-matricula matricula_db "Matrículas gravadas" \
    "SELECT protocolo, matricula_aluno AS aluno, codigo_turma AS turma, status, pendencias,
            to_char(solicitada_em AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI:SS') AS hora
       FROM matriculas ORDER BY solicitada_em;"
fi
