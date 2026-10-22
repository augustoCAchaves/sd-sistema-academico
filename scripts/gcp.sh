#!/usr/bin/env bash
# Deploy em 3 VMs do GCP, uma por componente. Uso: scripts/gcp.sh <comando>
#   criar              firewall, IP externo fixo da borda e as 3 VMs
#   subir [vm...]      envia o .env.gcp e sobe o compose de cada VM (padrão: as 3)
#   reset              volta os bancos ao estado inicial da demo
#   status | db        containers de cada VM | SELECTs da demo nos dois bancos
#   logs <vm>          acompanha os logs do serviço da VM
#   ssh <vm> [cmd]     abre um shell (ou roda cmd na pasta do projeto)
#   ligar | desligar   liga/desliga as 3 VMs
# vm: borda | registro | matricula
set -euo pipefail
cd "$(dirname "$0")/.."

ZONA=us-central1-a
REGIAO=us-central1
DIR=/opt/sd-sistema-academico
TODAS=(registro matricula borda)
declare -A IP=([borda]=10.128.0.10 [registro]=10.128.0.11 [matricula]=10.128.0.12)
declare -A SERVICOS=([borda]="api-gateway frontend" [registro]=registro-service [matricula]=matricula-service)
declare -A LOGS=([borda]=api-gateway [registro]=registro-service [matricula]=matricula-service)

vm() { echo "t2-$1"; }
remoto() { local alvo=$1; shift; gcloud compute ssh "$(vm "$alvo")" --zone "$ZONA" --quiet --command "$*"; }
ip_externo() { gcloud compute instances describe t2-borda --zone "$ZONA" --format='value(networkInterfaces[0].accessConfigs[0].natIP)'; }

gerar_env() {
  [ -f .env.gcp ] && return
  cat > .env.gcp <<EOF
COMPOSE_FILE=docker-compose.yml:docker-compose.gcp.yml
POSTGRES_USER=academico
POSTGRES_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
APP_PASSWORD=sd2026
REGISTRO_GRPC_URL=${IP[registro]}:50052
MATRICULA_GRPC_URL=${IP[matricula]}:50051
EOF
  echo ".env.gcp gerado"
}

criar() {
  gcloud compute firewall-rules create t2-borda-web --network default --direction INGRESS \
    --allow tcp:80,tcp:3000 --source-ranges 0.0.0.0/0 --target-tags t2-borda
  gcloud compute firewall-rules create t2-grpc-interno --network default --direction INGRESS \
    --allow tcp:50051,tcp:50052 --source-ranges 10.128.0.0/20 --target-tags t2-servico
  gcloud compute addresses create t2-borda-ip --region "$REGIAO"

  for alvo in "${TODAS[@]}"; do
    local extra=(--tags t2-servico)
    [ "$alvo" = borda ] && extra=(--tags t2-borda --address t2-borda-ip)
    gcloud compute instances create "$(vm "$alvo")" --zone "$ZONA" --machine-type e2-medium \
      --image-family debian-12 --image-project debian-cloud --boot-disk-size 20GB \
      --private-network-ip "${IP[$alvo]}" "${extra[@]}" \
      --metadata-from-file startup-script=scripts/gcp-startup.sh
  done
}

esperar() {
  printf 'aguardando %s ficar pronta' "$(vm "$1")"
  for _ in $(seq 60); do
    remoto "$1" "test -f /var/lib/sd-pronto" 2>/dev/null && { echo ' ok'; return; }
    printf .; sleep 5
  done
  echo ' timeout'; exit 1
}

subir() {
  gerar_env
  local alvos=("$@")
  [ ${#alvos[@]} -eq 0 ] && alvos=("${TODAS[@]}")
  for alvo in "${alvos[@]}"; do
    esperar "$alvo"
    gcloud compute scp .env.gcp "$(vm "$alvo"):/tmp/.env" --zone "$ZONA" --quiet
    remoto "$alvo" "sudo mv /tmp/.env $DIR/.env && cd $DIR && sudo git pull -q --ff-only && sudo docker compose up -d --build ${SERVICOS[$alvo]}"
  done
  echo "Frontend: http://$(ip_externo)   Gateway: http://$(ip_externo):3000"
}

case "${1:-}" in
  criar) criar ;;
  subir) shift; subir "$@" ;;
  reset)
    remoto matricula "cd $DIR && sudo docker compose exec -T matricula-service node dist/limpar.js"
    remoto registro "cd $DIR && sudo docker compose exec -T registro-service node dist/seed.js" ;;
  status)
    for alvo in "${TODAS[@]}"; do
      printf '\n\033[1m== %s (%s)\033[0m\n' "$(vm "$alvo")" "${IP[$alvo]}"
      remoto "$alvo" "cd $DIR && sudo docker compose ps --format 'table {{.Service}}\t{{.Status}}\t{{.Ports}}'"
    done
    echo; echo "Frontend: http://$(ip_externo)   Gateway: http://$(ip_externo):3000" ;;
  db)
    remoto registro "cd $DIR && sudo scripts/db.sh registro"
    remoto matricula "cd $DIR && sudo scripts/db.sh matricula" ;;
  logs)
    gcloud compute ssh "$(vm "$2")" --zone "$ZONA" --quiet --ssh-flag=-t \
      --command "cd $DIR && sudo docker compose logs -f --tail 5 ${LOGS[$2]}" ;;
  ssh)
    alvo=$2; shift 2
    if [ $# -gt 0 ]; then remoto "$alvo" "cd $DIR && $*"
    else gcloud compute ssh "$(vm "$alvo")" --zone "$ZONA"; fi ;;
  ligar) gcloud compute instances start t2-registro t2-matricula t2-borda --zone "$ZONA" ;;
  desligar) gcloud compute instances stop t2-borda t2-matricula t2-registro --zone "$ZONA" ;;
  *) sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
