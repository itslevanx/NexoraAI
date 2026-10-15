# NEXORA AI

![Logo de NEXORA AI](assets/nexora-logo.svg)

NEXORA AI es una suite académica multimodal con chat, herramientas de texto, visión, generación de imágenes, publicidad audiovisual, voz en tiempo real, síntesis de voz, transcripción y moderación. Incluye una aplicación local en Streamlit y una experiencia web serverless publicada en Vercel, sin credenciales incrustadas en el código.

## Aplicación publicada

[Abrir NEXORA AI](https://nexora-ai-blue-three.vercel.app/)

## Estado del proyecto

| Componente | Estado | Tecnología principal |
|---|---|---|
| Chat y Studio IA | Implementado | OpenAI Responses API |
| Voz a voz | Implementado | OpenAI Realtime API y WebRTC |
| Visión | Implementado | Entrada multimodal de OpenAI |
| Generación de imágenes | Implementado | OpenAI Image API |
| Publicidad UTP | Implementado | Google Veo 3.1 Fast, Supabase y montaje local |
| Texto a voz | Implementado | OpenAI Speech API |
| Transcripción y resumen | Implementado | OpenAI Transcriptions y Responses API |
| Moderación | Implementado | OpenAI Moderations API |

## Funcionalidades

### Studio IA

- Resume, reescribe, corrige y traduce contenido.
- Crea guías de estudio, exámenes, guiones, ideas y correos.
- Explica o revisa código y extrae datos estructurados.
- Analiza imágenes con una instrucción personalizada.
- Genera imágenes en formato cuadrado, horizontal o vertical.
- Convierte resultados en voz y aplica moderación para revisión humana.

### Voz en tiempo real

- Mantiene una conversación directa mediante `gpt-realtime-2.1`.
- Utiliza WebRTC para transportar micrófono y audio con baja latencia.
- Detecta turnos, permite interrumpir, silenciar y finalizar la llamada.
- Mantiene la clave de OpenAI exclusivamente en el servidor.

### Publicidad audiovisual UTP

- Acepta una foto tomada con la cámara o un archivo JPG, PNG o WEBP de hasta 10 MB.
- Reinterpreta cualquier concepto creativo como una campaña cinematográfica de la Universidad Tecnológica del Perú.
- Genera tomas con Google Veo 3.1 Fast, narración y música integradas.
- Entrega videos de 10, 15, 20 o 30 segundos en formato vertical 9:16 u horizontal 16:9.
- Añade textos e identidad UTP exactos durante el montaje local.
- Muestra el costo estimado antes de generar.
- Protege el módulo con un código validado en el servidor y una sesión firmada de ocho horas.
- Mantiene `GEMINI_API_KEY` en Vercel; nunca la expone al navegador.
- Guarda cada fotografía y video final en un bucket privado de Supabase.
- Presenta una galería histórica con estado, fecha, prompt, formato y duración.

![Arquitectura del módulo Publicidad UTP](docs/images/arquitectura-publicidad.png)

Publicidad es el único módulo que utiliza Google Gemini. Chat, Voz, Studio IA, Imágenes, Visión, Transcripción, Speech y Moderación continúan usando OpenAI.

La documentación específica está disponible en:

- [Guía técnica en Markdown](docs/PUBLICIDAD_UTP.md)
- [Documento para presentación](docs/Documentacion_Publicidad_UTP.docx)

### Transcripción de audio

- Graba audio desde el navegador o acepta MP3, MP4, MPEG, MPGA, M4A, WAV y WEBM.
- Convierte voz en texto con `gpt-transcribe`.
- Genera un resumen con idea central, puntos clave, decisiones y pendientes.
- Permite descargar el texto o reutilizarlo en el chat.

## Arquitectura

```text
Usuario
  └── NEXORA AI
       ├── Streamlit local
       └── Web en Vercel
            ├── OpenAI
            │    ├── Chat, Studio, Visión e Imágenes
            │    ├── Speech, Moderación y Transcripción
            │    └── Realtime y WebRTC
            ├── Google Gemini sólo para Publicidad
            │    ├── Veo 3.1 Fast
            │    ├── Operaciones asíncronas
            │    └── Descargas protegidas
            └── Supabase sólo para Publicidad
                 ├── PostgreSQL · metadatos y estados
                 └── Storage privado · fotografías y videos
```

Vercel sirve la interfaz y las funciones serverless. Supabase conserva el historial audiovisual. La misma plataforma también puede ejecutarse en un contenedor Docker mediante `docker compose up --build`.

> **Importante:** el despliegue de Vercel es serverless y no ejecuta el `Dockerfile`. El contenedor permite demostrar que la misma aplicación y su API se despliegan de forma reproducible. Si se exige que la URL pública también sea un contenedor, debe publicarse una segunda instancia en un servicio como Cloud Run, Render o Railway.

## Tecnologías

| Tecnología | Uso |
|---|---|
| Python 3 y Streamlit | Aplicación local y manejo de sesión |
| HTML5, CSS y JavaScript | Interfaz web adaptable |
| Vercel | Hosting HTTPS y funciones serverless |
| OpenAI APIs | Texto, visión, imágenes, voz, transcripción y moderación |
| WebRTC | Conversación de voz en tiempo real |
| Google Veo 3.1 Fast | Generación de tomas publicitarias desde una foto |
| Supabase PostgreSQL | Metadatos, estados y trazabilidad de capturas |
| Supabase Storage | Fotografías y videos en un bucket privado |
| Docker y Docker Compose | Despliegue reproducible de la plataforma y API |
| Canvas API | Composición de marca, textos y transiciones |
| Web Audio API | Mezcla del audio de las tomas |
| MediaRecorder | Exportación del video final |
| Node.js Crypto | Sesiones y enlaces temporales firmados |
| Pytest | Pruebas automatizadas sin consumo de video |

## Estructura principal

```text
NexoraAI/
├── app.py
├── public/
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── api/
│   ├── publicidad.js
│   ├── publicidad-acceso.js
│   ├── publicidad-video.js
│   ├── _publicidad-galeria.js
│   └── resto de funciones serverless
├── supabase/migrations/
├── container/server.mjs
├── Dockerfile
├── docker-compose.yml
├── assets/
├── docs/
│   ├── PUBLICIDAD_UTP.md
│   ├── Documentacion_Publicidad_UTP.docx
│   ├── images/
│   └── screenshots/
├── tests/
├── scripts/
├── requirements.txt
└── vercel.json
```

## Requisitos

- Python 3.10 o superior para la versión local.
- Una OpenAI API Key con saldo para los módulos generales.
- Una Gemini API Key de nivel pagado para Publicidad con Veo 3.1 Fast.
- Un proyecto Supabase con la migración incluida aplicada.
- Un navegador actualizado con soporte para cámara y `MediaRecorder`.

## Instalación local

### macOS o Linux

```bash
chmod +x run.sh
./run.sh
```

### Windows

Ejecutar `run.bat` desde el Explorador de archivos o CMD.

### Instalación manual

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
streamlit run app.py
```

En Windows, la activación se realiza con `.venv\Scripts\activate`.

## Variables de entorno

```dotenv
OPENAI_API_KEY=sk-proj-reemplazar
OPENAI_MODEL=gpt-5-mini
GEMINI_API_KEY=reemplazar-con-clave-de-google-ai-studio
PUBLICIDAD_ACCESS_CODE=define-un-codigo-seguro
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SECRET_KEY=sb_secret_reemplazar
```

El archivo `.env` está excluido de Git. Nunca se debe publicar una clave real en el repositorio, una captura o la documentación.

## Demostración con Docker

La demostración no llama a Google Veo ni consume saldo mientras no se pulse **Crear con Google Veo**.

```bash
docker compose up -d --build nexora
docker compose ps nexora
curl http://localhost:3000/health
```

Después, abrir `http://localhost:3000/publicidad`. Las tres evidencias que se deben mostrar son:

1. `docker compose ps nexora` presenta el servicio `nexora` como `Up` y, tras completar el chequeo, `healthy`.
2. `/health` responde con un JSON que confirma que el servidor está activo.
3. La interfaz de Publicidad abre desde el puerto `3000`, servido por el proceso definido en el `Dockerfile`.

Para reforzar la evidencia durante una exposición:

```bash
docker compose logs --tail=20 nexora
docker inspect nexoraai-nexora-1 --format '{{.Config.Image}} · {{.State.Health.Status}}'
```

El nombre asignado al contenedor puede variar. Si ocurre, se copia el nombre exacto mostrado por `docker compose ps`. Al terminar:

```bash
docker compose stop nexora
```

## Despliegue en Vercel

1. Importar el repositorio en Vercel.
2. Mantener `Other` como Framework Preset y usar el directorio raíz.
3. Añadir `OPENAI_API_KEY`, `GEMINI_API_KEY`, `PUBLICIDAD_ACCESS_CODE`, `SUPABASE_URL` y `SUPABASE_SECRET_KEY` en los entornos necesarios.
4. Ejecutar el despliegue.
5. Autorizar micrófono y cámara cuando el navegador lo solicite.

## Endpoints web

| Endpoint | Propósito | Validación principal |
|---|---|---|
| `/api/chat` | Chat contextual | Mensajes válidos |
| `/api/studio` | Herramientas de texto | Modo y tamaño permitidos |
| `/api/vision` | Análisis de imágenes | Tipo y tamaño de archivo |
| `/api/image` | Generación de imágenes | Prompt y formato permitido |
| `/api/speech` | Texto a voz | Límite de caracteres |
| `/api/moderate` | Clasificación de seguridad | Texto no vacío |
| `/api/transcribe` | Audio a texto | Tipo y tamaño de audio |
| `/api/realtime-session` | Voz por WebRTC | Oferta SDP válida |
| `/api/publicidad-acceso` | Acceso a Publicidad | Código del servidor y sesión HMAC |
| `/api/publicidad` | Inicio y consulta de Veo | Sesión, foto, prompt y duración |
| `/api/publicidad-video` | Descarga de tomas | Sesión y token temporal HMAC |
| `/api/publicidad?gallery=1` | Capturas, cargas, estados y galería | Sesión HMAC, Supabase privado y enlaces firmados |

## Uso de Publicidad

1. Abrir **Publicidad** o acceder directamente a `/publicidad`.
2. Ingresar el código autorizado.
3. Abrir la cámara o subir una foto; la captura se guarda inmediatamente en Supabase.
4. Escribir el concepto creativo.
5. Elegir duración, formato y estilo.
6. Revisar el costo estimado y confirmar la generación.
7. Mantener la pestaña abierta durante la generación y el montaje.
8. Reproducir y descargar el video final.
9. Consultar la fotografía y el video terminado en la galería histórica.

La fotografía optimizada y el concepto se envían a Google Gemini. La clave permanece en Vercel. Las tomas regresan mediante enlaces temporales firmados y el navegador compone el archivo final en memoria. Después, la versión final se carga directamente a Supabase mediante una URL firmada temporal, sin exponer la clave secreta ni atravesar el límite de carga de Vercel.

La imagen se envía a Veo dentro de `instances[0].image` mediante `bytesBase64Encoded` y `mimeType`. Los parámetros enviados se limitan a `aspectRatio`, `durationSeconds`, `resolution` y `personGeneration`; `durationSeconds` se transmite como número. La API genera un solo video por operación sin declarar `numberOfVideos`, porque ese campo no es aceptado por el modelo configurado.

## Pruebas

```bash
python -m pytest -q
python -m py_compile app.py
npm run check
```

Las validaciones automatizadas no deben generar videos ni consumir saldo de Gemini. La verificación audiovisual final se realiza manualmente con autorización del propietario.

## Seguridad y privacidad

- Las claves se guardan como variables de entorno y no se incluyen en el cliente.
- `SUPABASE_SECRET_KEY` se utiliza exclusivamente en el servidor.
- El bucket `publicidad-utp` es privado; la galería recibe enlaces firmados que vencen en una hora.
- La tabla tiene RLS habilitado y no concede acceso a los roles públicos.
- Publicidad exige una sesión HMAC válida para generar, consultar y descargar.
- El código de acceso se compara en tiempo constante en el servidor.
- La sesión de Publicidad permanece en `sessionStorage` y vence después de ocho horas.
- La foto se optimiza en el navegador antes de enviarse a Gemini.
- Los enlaces de descarga de las tomas expiran después de una hora.
- No se deben usar datos sensibles ni fotografías sin autorización.
- La moderación y el análisis automático requieren revisión humana.

## Limitaciones

- La galería de Publicidad conserva sus fotografías y videos de manera permanente en Supabase.
- Los archivos enviados a las funciones web están sujetos a límites de tamaño.
- Veo puede tardar varios minutos por toma.
- La generación audiovisual consume saldo de Google Gemini.
- Safari prioriza MP4 cuando está disponible; otros navegadores pueden exportar WebM.
- El resultado de una IA generativa requiere revisión antes de publicarse.

## Documentación

- [Guía de Publicidad en Markdown](docs/PUBLICIDAD_UTP.md)
- [Guía de Publicidad para presentación](docs/Documentacion_Publicidad_UTP.docx)
- [Informe general histórico](docs/DOCUMENTACION_COMPLETA.md)
- [Informe general en Word](docs/Documentacion_NEXORA_AI.docx)

## Fuentes oficiales

- [OpenAI API](https://developers.openai.com/api/docs/)
- [OpenAI Realtime con WebRTC](https://developers.openai.com/api/docs/guides/voice-webrtc)
- [Google Veo](https://ai.google.dev/gemini-api/docs/veo)
- [Precios de Gemini API](https://ai.google.dev/gemini-api/docs/pricing)
- [Vercel Functions](https://vercel.com/docs/functions)
- [MediaDevices](https://developer.mozilla.org/docs/Web/API/MediaDevices)
- [Canvas API](https://developer.mozilla.org/docs/Web/API/Canvas_API)
- [MediaRecorder](https://developer.mozilla.org/docs/Web/API/MediaRecorder)
- [Universidad Tecnológica del Perú](https://www.utp.edu.pe/)

## Uso académico

Proyecto preparado con fines académicos. Antes de utilizarlo con datos reales, se deben revisar las políticas de los servicios conectados, establecer límites de gasto y mantener supervisión humana sobre el contenido generado.
