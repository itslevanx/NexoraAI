#!/usr/bin/env bash
set -euo pipefail

curl -fsS -X POST http://localhost:5678/webhook/nexora \
  -H 'Content-Type: application/json' \
  --data-binary '{
    "action": "email",
    "recipient": "docente@ejemplo.com",
    "subject": "NEXORA AI - Demostración local",
    "content": "Hola profesor. Este correo fue enviado automáticamente por NEXORA AI y n8n dentro de la Mac."
  }'

echo
echo "Abre http://localhost:8025 para mostrar el correo recibido."
