#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

docker compose up -d --build

for workflow in \
  nexora-n8n.json \
  nexora-coach-estudio.json \
  nexora-laboratorio-reuniones.json \
  nexora-guardian-privacidad.json \
  nexora-panel-impacto.json
do
  docker compose cp "automations/$workflow" "n8n:/tmp/$workflow"
  docker compose exec -T n8n n8n import:workflow --input="/tmp/$workflow"
done

for workflow_id in \
  nexoraLocalV2 \
  nexoraStudyCoachV1 \
  nexoraMeetingLabV1 \
  nexoraPrivacyGuardianV1 \
  nexoraImpactDashboardV1
do
  docker compose exec -T n8n n8n publish:workflow --id="$workflow_id"
done

docker compose restart n8n
curl --retry 20 --retry-all-errors --retry-delay 1 -fsS http://localhost:5678/healthz

echo
echo "NEXORA local está listo"
echo "n8n:    http://localhost:5678"
echo "Correo: http://localhost:8025"
echo "Webhook: http://localhost:5678/webhook/nexora"
