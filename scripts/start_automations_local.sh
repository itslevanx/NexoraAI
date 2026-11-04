#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if command -v docker >/dev/null 2>&1; then DOCKER=$(command -v docker); else DOCKER=/Applications/Docker.app/Contents/Resources/bin/docker; fi
if [ ! -x "$DOCKER" ]; then echo 'Instala e inicia Docker Desktop.'; exit 1; fi
export PATH="$(dirname "$DOCKER"):$PATH"
"$DOCKER" info >/dev/null
node scripts/prepare_automations_local.mjs
compose() { "$DOCKER" compose --env-file n8n-local/.env -f docker-compose.automations.yml "$@"; }
compose up -d --build
for attempt in {1..40}; do
  if curl -fsS http://127.0.0.1:5678/healthz >/dev/null 2>&1; then break; fi
  sleep 2
done
curl -fsS http://127.0.0.1:5678/healthz >/dev/null
compose exec -T -u root n8n sh -c 'cp /bootstrap/credentials.json /tmp/nexora-credentials.json && chown node:node /tmp/nexora-credentials.json && chmod 600 /tmp/nexora-credentials.json'
compose exec -T n8n n8n import:credentials --input=/tmp/nexora-credentials.json
compose exec -T n8n rm /tmp/nexora-credentials.json
for file in agenda study reports bot-tasks bot-study bot-meetings; do
  compose exec -T n8n n8n import:workflow --input="/imports/$file.json"
done
for workflow_id in nexoraTA4Agenda nexoraTA4Study nexoraTA4Reports nexoraTA4Bottasks nexoraTA4Botstudy nexoraTA4Botmeetings; do
  compose exec -T n8n n8n publish:workflow --id="$workflow_id"
done
compose restart n8n
for attempt in {1..40}; do
  if curl -fsS http://127.0.0.1:3000/api/automation -H 'Content-Type: application/json' --data '{"workflow":"agenda","operation":"list"}' >/dev/null 2>&1; then break; fi
  sleep 2
done
curl -fsS http://127.0.0.1:3000/api/automation -H 'Content-Type: application/json' --data '{"workflow":"agenda","operation":"list"}' >/dev/null
printf '\nAutomatizaciones: http://localhost:3000/#automate\nn8n: http://localhost:5678\n'
