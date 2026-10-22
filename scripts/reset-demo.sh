#!/usr/bin/env bash
# Volta os dois bancos ao estado inicial da demo (vagas do seed, nenhuma matrícula).
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose exec -T matricula-service node dist/limpar.js
docker compose exec -T registro-service node dist/seed.js
