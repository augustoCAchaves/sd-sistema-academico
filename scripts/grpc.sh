#!/usr/bin/env bash
# Uso: scripts/grpc.sh <registro|matricula> <Metodo> ['{"campo":"valor"}']
set -euo pipefail
cd "$(dirname "$0")/.."

case "${1:-}" in
  registro) alvo=${REGISTRO_GRPC_URL:-registro-service:50052}; servico=registro.RegistroAcademicoService ;;
  matricula) alvo=${MATRICULA_GRPC_URL:-matricula-service:50051}; servico=matricula.MatriculaService ;;
  *) echo "uso: $0 <registro|matricula> <Metodo> ['{json}']" >&2; exit 1 ;;
esac

docker run --rm --network "${GRPC_NETWORK:-sd-sistema-academico_default}" \
  -v "$PWD/packages/contratos-grpc/proto:/proto:ro" \
  fullstorydev/grpcurl:v1.9.3 \
  -plaintext -emit-defaults -import-path /proto -proto registro.proto -proto matricula.proto \
  -rpc-header "x-correlation-id: grpcurl" \
  -d "${3:-{\}}" "$alvo" "$servico/$2"
