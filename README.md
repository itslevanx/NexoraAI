# NEXORA AI

![NEXORA AI](assets/nexora-icon.png)

Asistente académico con chatbot, transcripción de audio y automatizaciones mediante n8n. Está listo para funcionar pegando una OpenAI API Key desde la barra lateral; la clave se conserva únicamente durante la sesión.

## Lo que demuestra

- Chat contextual con la OpenAI Responses API.
- Transcripción de grabaciones o archivos con `gpt-transcribe`.
- Resúmenes automáticos y exportación a TXT.
- Webhook para registrar información, enviar email o preparar WhatsApp mediante n8n.
- Interfaz Streamlit personalizada, responsiva y animada.

## Inicio rápido

### macOS / Linux

```bash
chmod +x run.sh
./run.sh
```

### Windows

Haz doble clic en `run.bat` o ejecútalo desde CMD.

También puedes hacerlo manualmente:

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py
```

Después abre `http://localhost:8501`, pega tu API key en la barra lateral y prueba el chat. No es necesario editar código.

## Clave por variable de entorno (opcional)

```bash
cp .env.example .env
```

Edita `.env` y reemplaza el valor de ejemplo. El archivo está excluido de Git. Para una exposición, pegar la clave en la interfaz es más directo y no la deja guardada.

## n8n en 5 pasos

1. Instala Docker Desktop si todavía no lo tienes.
2. Ejecuta `docker compose up -d` en esta carpeta.
3. Abre `http://localhost:5678` e importa `automations/nexora-n8n.json`.
4. Activa el workflow y pega `http://localhost:5678/webhook/nexora` en la barra lateral de NEXORA.
5. Prueba las tres acciones desde **Automatizaciones**.

La plantilla está deliberadamente en modo demostración: valida, enruta y confirma cada acción sin enviar nada real. Para una integración real, sustituye los nodos `DEMO` por:

- Google Sheets → **Append Row in Sheet**.
- Email → **Gmail: Send a message** o SMTP.
- WhatsApp → **WhatsApp Business Cloud** o Twilio.

Configura las credenciales dentro de n8n, nunca dentro de Streamlit ni del JSON del proyecto.

## Guion para impresionar en la exposición

1. Presenta el problema: información dispersa entre chat, notas de voz y tareas manuales.
2. Pregunta al chatbot: “Explícame la computación cuántica con una analogía y crea 3 preguntas de repaso”.
3. Graba una nota de voz de 10–15 segundos y transcríbela.
4. Pulsa **Crear resumen** y enseña cómo aparecen decisiones y pendientes.
5. Ve a **Automatizaciones**, envía el resumen al webhook y abre n8n para mostrar la ejecución visual.
6. Cierra destacando seguridad, desacoplamiento y posibles extensiones.

## Arquitectura

```text
Usuario
  │
  ▼
Streamlit / NEXORA AI ─────► OpenAI Responses API
  │                         OpenAI Transcriptions API
  │
  └──── webhook JSON ──────► n8n ──► Sheets / Email / WhatsApp
```

## Notas de seguridad

- No subas tu API key a GitHub ni la escribas en el código.
- Regenera la clave si llega a aparecer en una captura o exposición.
- El flujo n8n de muestra no recibe la clave de OpenAI.
- Los archivos de audio se envían a la API para su transcripción; evita usar grabaciones sensibles en la demo.

## Fuentes técnicas

- [Inicio rápido de OpenAI](https://developers.openai.com/api/docs/quickstart)
- [Guía oficial de transcripción](https://developers.openai.com/api/docs/guides/speech-to-text)
- [Documentación de Streamlit](https://docs.streamlit.io/)
- [Documentación de n8n](https://docs.n8n.io/)
