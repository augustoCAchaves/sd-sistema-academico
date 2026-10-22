#!/bin/bash
# Startup script das VMs (roda como root a cada boot): Docker + clone do repositório.
set -euo pipefail
command -v git >/dev/null || { apt-get update -q && apt-get install -y -q git; }
command -v docker >/dev/null || curl -fsSL https://get.docker.com | sh
[ -d /opt/sd-sistema-academico ] || git clone -q https://github.com/augustoCAchaves/sd-sistema-academico.git /opt/sd-sistema-academico
touch /var/lib/sd-pronto
