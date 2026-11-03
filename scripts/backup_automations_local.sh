#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077
if command -v docker >/dev/null 2>&1; then DOCKER=$(command -v docker); else DOCKER=/Applications/Docker.app/Contents/Resources/bin/docker; fi
export PATH="$(dirname "$DOCKER"):$PATH"
compose() { "$DOCKER" compose --env-file n8n-local/.env -f docker-compose.automations.yml "$@"; }
backup="n8n-local/backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$backup"
trap 'compose start automation n8n >/dev/null' EXIT
compose stop automation n8n
compose cp automation:/data/. "$backup/data"
compose cp n8n:/home/node/.n8n/. "$backup/n8n"
cp n8n-local/.env "$backup/local.env"
chmod -R go-rwx "$backup"
printf 'Copia local guardada en %s\nIncluye credenciales: no la compartas.\n' "$backup"
