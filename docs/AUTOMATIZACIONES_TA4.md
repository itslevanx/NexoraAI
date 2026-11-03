# Automatizaciones locales · TA4

Este cambio solo amplía Automatizaciones y añade su infraestructura local. No cambia chat, voz, Studio, publicidad, transcripción ni sus APIs. No necesita una API de IA de pago.

## Inicio

Requisitos: Docker Desktop iniciado, Node.js 24 para preparar la configuración y ejecutar pruebas, y los puertos 3000 y 5678 disponibles.

```bash
./scripts/start_automations_local.sh
```

Abrir http://localhost:3000/#automate. El script genera secretos aleatorios (solo la primera vez), construye tres servicios, importa una credencial compartida y publica seis workflows. Puede repetirse sin borrar los datos; reimporta las definiciones de `automations/local/`, por lo que los cambios de estos seis workflows deben guardarse también en sus archivos fuente. La primera descarga puede tardar varios minutos.

n8n se administra desde http://localhost:5678. Si pide crear el usuario administrador, completar ese paso personalmente. El arranque por CLI no inventa una cuenta ni una contraseña.

Los puertos públicos de ambos servicios están ligados exclusivamente a 127.0.0.1. El servicio de datos no publica un puerto. Usar el NEXORA local: el despliegue de Vercel no puede llegar al localhost de la Mac.

## Seis workflows

| Archivo | Disparador | Función |
|---|---|---|
| `agenda.json` | Formulario y cada minuto | Tareas, entregas, acuerdos, vencimientos y avisos de estudio |
| `study.json` | Formulario | Planificación diaria, práctica, repaso y reprogramaciones |
| `reports.json` | Botones y cada minuto | Reportes manuales, diario desde las 08:00 y semanal el domingo desde las 18:00 |
| `bot-tasks.json` | Mensaje recuperado por el receptor local | Registrar, consultar y completar tareas |
| `bot-study.json` | Mensaje recuperado por el receptor local | Consultar sesiones, completarlas y reprogramarlas |
| `bot-meetings.json` | Mensaje recuperado por el receptor local | Registrar acuerdos y responsables, consultar y completar compromisos |

Las tres primeras funcionan sin Telegram. Los avisos y el historial quedan disponibles en NEXORA; al conectar Telegram también se entregan mensajes al chat autorizado.

Todos los horarios sin zona explícita se interpretan en America/Lima (UTC-05:00). El planificador crea una sesión al día hasta el examen, omite horarios ocupados y alterna estudio, repaso y autoevaluación. No interpreta apuntes con IA ni promete extraer acuerdos de texto libre. Los acuerdos se registran mediante campos explícitos.

## Uso desde NEXORA

1. **Agenda:** título, curso, fecha/hora y prioridad. Guardar y completar desde la lista.
2. **Estudio:** tema, examen, minutos y hora diaria. El calendario se guarda y se muestran las primeras 30 sesiones pendientes. Para reprogramar, elegir otro horario futuro que termine antes del examen y no choque con otra sesión.
3. **Reuniones:** título, contexto, acuerdo, responsable y fecha. El acuerdo aparece como tarea compartida con el bot.
4. **Reportes:** los botones consultan las últimas 24 horas o 7 días. Los reportes automáticos quedan en el historial.
5. **Historial y estado:** ejecuciones recientes y errores de conexión de Telegram. Los textos de tareas no se guardan en el registro de eventos.

Las acciones anteriores de demostración se conservan en un desplegable y requieren la infraestructura anterior; no son parte de estos seis workflows.

## Conectar Telegram sin túnel

1. Crear un bot dedicado en @BotFather dentro de Telegram.
2. Enviar `/start` al bot desde un chat privado.
3. Abrir **Conectar el bot de Telegram** en NEXORA local.
4. Pegar el token y pulsar **Buscar mi chat**. Seleccionar el identificador mostrado.
5. Pulsar **Conectar Telegram** y enviar `/ayuda` al bot.

El token se guarda cifrado con AES-256-GCM en el servicio local, nunca en Git ni en el navegador de forma persistente. Las credenciales internas de los workflows se guardan cifradas por n8n. El token de Telegram no pasa por las ejecuciones de n8n.

El receptor local consulta `getUpdates` cada cinco segundos y entrega el mensaje al workflow correspondiente. No usa Telegram Trigger, un dominio ni un webhook público. Un bot que ya tenga un webhook configurado será rechazado: usar un bot dedicado. No ejecutar otra instancia de polling con ese mismo token.

Solo se aceptan mensajes del chat privado configurado. Los comandos previos a la primera conexión no se ejecutan retroactivamente. El bot ofrece un teclado con consultas frecuentes y estos comandos:

```text
/ayuda
/hoy
/pendientes
/agregar Entregar informe | 2026-11-10T18:00 | Programación
/hecho ID_DE_TAREA
/estudio
/estudiado ID_DE_SESION
/reprogramar ID_DE_SESION | 2026-11-05T19:00
/reuniones
/acuerdo Avance semanal | Ana | 2026-11-10T18:00 | Revisar prototipo
/acuerdohecho ID_DE_TAREA
```

Los identificadores se incluyen en las respuestas. Los mensajes usan texto sin formato, sin ejecutar instrucciones arbitrarias ni interpretar lenguaje natural. El token y el chat real deben aportarlos el usuario; las pruebas automatizadas usan Telegram simulado y no envían mensajes reales.

## Persistencia y reintentos

- SQLite conserva tareas, planes, sesiones, reuniones, reportes, solicitudes, bandeja de entrada y salida en el volumen `automation_data`.
- El volumen `n8n_data` conserva workflows, credenciales y configuración de n8n.
- `n8n-local/.env` contiene las claves locales y se crea con permisos restringidos. **Conservarlo junto con los volúmenes:** regenerarlo impide descifrar las credenciales existentes.
- Las mutaciones desde NEXORA conservan un identificador al reintentar una solicitud. Los mensajes de Telegram se identifican por actualización y los workflows añaden el ID de ejecución si falta uno.
- Los fallos al contactar n8n mantienen el mensaje pendiente. Los envíos a Telegram tienen hasta diez intentos; el último error aparece en el estado. Para reintentar manualmente avisos agotados, solucionar primero la conexión y usar la operación administrativa descrita abajo.
- Telegram no garantiza entrega exactamente una vez: si acepta un mensaje y se pierde la respuesta de red, el reintento podría duplicar el aviso. Los cambios en tareas y sesiones sí se deduplican localmente.
- Si la Mac duerme o se apaga, los procesos se detienen. Al regresar, se revisan tareas pendientes y el reporte del día; no se reconstruyen reportes de días completos sin actividad. Telegram conserva actualizaciones pendientes por un máximo de 24 horas.

### Reintentar avisos agotados

Después de corregir el token, la red o el chat, ejecutar desde la raíz (en macOS se puede usar la ruta completa de Docker si no está en PATH):

```bash
docker compose --env-file n8n-local/.env -f docker-compose.automations.yml exec automation node --input-type=module -e "import {DatabaseSync} from 'node:sqlite'; const db=new DatabaseSync('/data/automation.sqlite'); db.exec(\"UPDATE outbox SET attempts=0 WHERE status='pending'\"); db.close();"
```

## Detener y respaldar

```bash
docker compose --env-file n8n-local/.env -f docker-compose.automations.yml stop
./scripts/backup_automations_local.sh
```

El respaldo pausa n8n y el servicio de datos, copia ambos almacenamientos y la configuración, y vuelve a iniciarlos. Las copias quedan en `n8n-local/backups/`, excluidas de Git. Incluyen credenciales: no compartirlas. Evitar `down -v`, que elimina los volúmenes.

Para restaurar: detener ambos servicios, conservar antes una copia del estado actual, restaurar `data/` y `n8n/` del respaldo en sus respectivos volúmenes y `local.env` como `n8n-local/.env`. Restaurar propietario `node:node` en ambos volúmenes y volver a iniciar el stack. No mezclar claves de otra instalación.

## Validación

```bash
npm run check
npm run check:automations
```

Las pruebas nuevas cubren fechas en Lima, persistencia, reintentos sin duplicados, transacciones de reuniones, horarios de estudio, reportes y avisos, los tres bots, acceso al servicio y cifrado del token. Una prueba HTTP usa un puerto temporal en 127.0.0.1.

Referencias: [n8n Community](https://docs.n8n.io/deploy/host-n8n/community-edition-features.md), [CLI n8n](https://docs.n8n.io/deploy/host-n8n/configure-n8n/use-the-command-line.md), [Telegram getUpdates](https://core.telegram.org/bots/api#getupdates).
