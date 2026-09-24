# NEXORA AI

![Icono de NEXORA AI](assets/nexora-icon.png)

NEXORA AI es una aplicación académica desarrollada con Streamlit que reúne tres capacidades en una sola interfaz: conversación con inteligencia artificial, transcripción de audio y automatización de tareas mediante n8n. El proyecto demuestra el uso práctico de las API de OpenAI y la integración de servicios externos sin exponer credenciales en el código.

## Estado del proyecto

| Componente | Estado | Descripción |
|---|---|---|
| Chat con IA | Implementado | Utiliza la Responses API y conserva el contexto de la sesión |
| Transcripción | Implementado | Acepta grabación directa y archivos compatibles de hasta 25 MB |
| Resumen de audio | Implementado | Convierte la transcripción en ideas, decisiones y pendientes |
| Exportación | Implementado | Permite descargar la transcripción en formato TXT |
| Automatización n8n | Modo demostración | Valida, enruta y confirma acciones por webhook |
| Sheets, email y WhatsApp reales | Requiere credenciales | Se conectan sustituyendo los nodos DEMO dentro de n8n |
| Pruebas de humo | Implementado | Verifican archivos esenciales y validez del workflow |

## Funcionalidades

### Chat inteligente

- Envía preguntas a un modelo disponible en la cuenta de OpenAI.
- Mantiene los últimos mensajes como contexto durante la sesión.
- Incluye instrucciones orientadas a productividad y apoyo académico.
- Permite cambiar el modelo sin editar el código.
- Puede reiniciar la conversación desde la interfaz.

### Transcripción de audio

- Graba audio directamente desde el navegador.
- Acepta MP3, MP4, MPEG, MPGA, M4A, WAV y WEBM.
- Valida el límite de 25 MB antes de hacer la solicitud.
- Utiliza `gpt-transcribe` para transformar voz en texto.
- Genera un resumen con idea central, puntos clave, decisiones y pendientes.
- Permite descargar el texto o reutilizarlo dentro del chat.

### Automatizaciones con n8n

- Envía solicitudes HTTP mediante un webhook configurable.
- Soporta las acciones `sheet`, `email` y `whatsapp`.
- Valida y normaliza el contenido antes de procesarlo.
- Mantiene las credenciales de servicios externos dentro de n8n.
- Incluye un workflow importable en `automations/nexora-n8n.json`.

### Experiencia visual

- Identidad propia con icono generado para NEXORA AI.
- Diseño oscuro con efectos de glassmorphism.
- Animaciones CSS de entrada, pulso y onda de audio.
- Navegación lateral y diseño adaptable.
- Indicadores de estado y número de solicitudes realizadas.

## Arquitectura

```text
                        ┌──────────────────────────┐
                        │      OpenAI Platform     │
                        │  Responses / Transcribe  │
                        └────────────▲─────────────┘
                                     │ HTTPS
┌──────────┐      navegador      ┌───┴──────────────┐
│ Usuario  ├────────────────────►│   NEXORA AI      │
└──────────┘                     │   Streamlit      │
                                 └───┬──────────────┘
                                     │ webhook JSON
                        ┌────────────▼─────────────┐
                        │           n8n            │
                        │ validación y enrutamiento│
                        └─────┬────────┬───────────┘
                              │        │
                       Sheets/email/WhatsApp
```

Streamlit actúa como capa de servidor y utiliza la clave únicamente en memoria o desde una variable de entorno. n8n recibe solo el contenido necesario para la automatización; nunca recibe la clave de OpenAI.

## Tecnologías

| Tecnología | Uso en el proyecto |
|---|---|
| Python 3 | Lógica principal de la aplicación |
| Streamlit | Interfaz web y manejo de sesión |
| OpenAI Python SDK | Chat y transcripción |
| Responses API | Generación de respuestas del asistente |
| Transcriptions API | Conversión de audio en texto |
| n8n | Orquestación de automatizaciones |
| Docker Compose | Ejecución local opcional de n8n |
| Requests | Envío de payloads al webhook |
| Pytest | Pruebas de humo |

## Estructura del repositorio

```text
NexoraAI/
├── app.py                              # Aplicación Streamlit
├── assets/nexora-icon.png              # Icono de la aplicación
├── automations/nexora-n8n.json         # Workflow importable de n8n
├── docs/
│   ├── DOCUMENTACION_COMPLETA.md       # Fuente del informe académico
│   └── Documentacion_NEXORA_AI.docx    # Documento Word final
├── tests/test_smoke.py                 # Pruebas básicas
├── .streamlit/config.toml              # Tema y límite de carga
├── .env.example                        # Variables de entorno de ejemplo
├── docker-compose.yml                  # Servicio local de n8n
├── requirements.txt                    # Dependencias Python
├── run.sh                              # Inicio rápido macOS/Linux
└── run.bat                             # Inicio rápido Windows
```

## Requisitos

- Python 3.10 o superior.
- Una OpenAI API Key con saldo y acceso a los modelos utilizados.
- Navegador actualizado.
- Docker Desktop únicamente para ejecutar n8n localmente.

## Instalación rápida

### macOS o Linux

```bash
chmod +x run.sh
./run.sh
```

### Windows

Ejecutar `run.bat` desde el Explorador de archivos o desde CMD.

### Instalación manual

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
streamlit run app.py
```

En Windows, la activación se realiza con `.venv\Scripts\activate`. La interfaz estará disponible normalmente en `http://localhost:8501`.

## Configuración de OpenAI

La forma más sencilla para una exposición es pegar la clave en **OpenAI API Key**. El campo oculta su contenido y la clave no se escribe en disco.

También puede utilizarse un archivo `.env`:

```bash
cp .env.example .env
```

```dotenv
OPENAI_API_KEY=sk-proj-reemplazar
OPENAI_MODEL=gpt-5-mini
N8N_WEBHOOK_URL=http://localhost:5678/webhook/nexora
```

El archivo `.env` está excluido de Git. Nunca se debe publicar una clave real en el repositorio, una captura o el informe.

## Configuración de n8n

### Levantar n8n con Docker

```bash
docker compose up -d
```

Abrir `http://localhost:5678`, completar la configuración inicial e importar `automations/nexora-n8n.json`.

### Activar el workflow

1. Abrir **NEXORA AI Centro de automatizaciones**.
2. Verificar que el webhook tenga la ruta `nexora`.
3. Activar el workflow.
4. Copiar `http://localhost:5678/webhook/nexora` en la barra lateral.
5. Ejecutar una acción desde **Automatizaciones**.

### Convertir la demostración en una integración real

Los nodos `DEMO` no envían mensajes ni escriben datos externos.

- Sustituir **DEMO Google Sheets** por Google Sheets con la operación Append Row.
- Sustituir **DEMO Enviar email** por Gmail, Outlook o SMTP.
- Sustituir **DEMO WhatsApp** por WhatsApp Business Cloud o Twilio.
- Configurar las credenciales únicamente dentro de n8n.
- Mantener los nodos de validación y enrutamiento.
- Probar primero con cuentas y datos del equipo.

## Formato del webhook

```json
{
  "action": "email",
  "recipient": "docente@ejemplo.com",
  "subject": "Resumen de la sesión",
  "content": "Contenido revisado por el usuario",
  "source": "NEXORA AI",
  "timestamp": "2026-09-23T20:30:00"
}
```

Respuesta de demostración:

```json
{
  "ok": true,
  "app": "NEXORA AI",
  "action": "email",
  "message": "DEMO: correo preparado correctamente"
}
```

## Pruebas

```bash
python -m pytest -q
python -m py_compile app.py
```

Las pruebas verifican archivos esenciales, lectura del JSON, identidad del workflow, cantidad mínima de nodos y sintaxis de Python. Las llamadas reales a OpenAI no forman parte de las pruebas automáticas porque requieren una clave, saldo y acceso a red.

## Seguridad y privacidad

- La clave ingresada permanece en la sesión de Streamlit.
- `.env` y `.streamlit/secrets.toml` están ignorados por Git.
- El webhook recibe datos de la tarea, no la clave de OpenAI.
- La app aplica timeout y reintentos limitados.
- Los audios se envían a OpenAI; no se deben usar grabaciones sensibles en la demo.
- Las acciones reales deben configurarse con credenciales protegidas y aprobación cuando corresponda.

## Demostración recomendada

1. Presentar el problema: chat, notas de voz y tareas manuales están dispersos.
2. Pegar la API key sin mostrarla al público.
3. Preguntar: “Explícame la computación cuántica con una analogía y crea tres preguntas de repaso”.
4. Grabar una nota de voz de 10 a 15 segundos.
5. Transcribirla y generar el resumen.
6. Enviar el contenido al webhook n8n.
7. Mostrar la ejecución visual dentro de n8n.
8. Explicar que las credenciales permanecen fuera del código.

## Limitaciones

- El historial vive únicamente durante la sesión.
- El workflow opera en modo demostración hasta configurar credenciales.
- No existe autenticación de usuarios.
- Los archivos están limitados a 25 MB.
- El modelo debe estar disponible en la cuenta del usuario.
- El consumo de API puede generar costos.

## Mejoras propuestas

- Autenticación y perfiles de usuario.
- Persistencia en PostgreSQL o Supabase.
- Biblioteca de transcripciones y búsquedas.
- Respuestas en streaming.
- Panel de costos y consumo.
- Procesamiento de documentos PDF.
- Aprobación de automatizaciones reales.
- Despliegue con HTTPS y gestión de secretos.

## Documentación académica

- `docs/DOCUMENTACION_COMPLETA.md`: fuente editable del informe.
- `docs/Documentacion_NEXORA_AI.docx`: documento listo para Microsoft Word.

Incluye problema, objetivos, alcance, requisitos, casos de uso, arquitectura, código, instalación, manual de usuario, n8n, seguridad, pruebas, riesgos, conclusiones, glosario, bibliografía y anexos.

## Fuentes oficiales

- [Inicio rápido de OpenAI](https://developers.openai.com/api/docs/quickstart)
- [Guía de transcripción de OpenAI](https://developers.openai.com/api/docs/guides/speech-to-text)
- [Documentación de Streamlit](https://docs.streamlit.io/)
- [Documentación de n8n](https://docs.n8n.io/)
- [Documentación de Docker Compose](https://docs.docker.com/compose/)

## Datos del equipo

Completar antes de la entrega:

- Institución:
- Curso:
- Docente:
- Integrantes:
- Ciclo o sección:
- Fecha:

## Uso académico

Proyecto preparado con fines académicos. Antes de utilizarlo con datos reales, el equipo debe definir una licencia, revisar las políticas de los servicios conectados y reemplazar todos los datos de demostración.
