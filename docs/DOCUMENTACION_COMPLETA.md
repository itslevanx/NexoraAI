# Documentación integral del proyecto NEXORA AI

## Datos para la carátula

| Campo | Información que debe completar el equipo |
|---|---|
| Institución | Nombre de la universidad o instituto |
| Facultad o programa | Nombre de la facultad o carrera |
| Curso | Nombre del curso |
| Proyecto | NEXORA AI |
| Docente | Nombre completo del docente |
| Integrantes | Nombres completos y códigos |
| Ciclo y sección | Ciclo académico y sección |
| Ciudad y país | Ciudad y país |
| Fecha | Fecha de presentación |

## Resumen ejecutivo

NEXORA AI es una suite web multimodal de apoyo académico y productividad con dos interfaces complementarias: una versión local en Python y Streamlit y una versión desplegable en Vercel. Integra chat contextual, once herramientas especializadas de texto, visión artificial, generación de imágenes, texto a voz, moderación, conversación de voz a voz mediante Realtime API y WebRTC, transcripción de audio y automatizaciones conectadas a n8n. El propósito es demostrar cómo una experiencia unificada puede procesar texto, voz e imágenes y entregar datos estructurados a flujos externos sin incrustar credenciales sensibles en el código.

La persona usuaria puede pegar temporalmente una OpenAI API Key, seleccionar un modelo disponible, conversar por texto o voz, transformar contenido, crear guías y evaluaciones, analizar una imagen, generar una pieza visual, escuchar una narración sintética, revisar contenido potencialmente riesgoso, grabar o cargar un audio, generar un resumen, descargar resultados y activar una automatización. El workflow incluido opera en modo demostración seguro: valida la solicitud, identifica la acción y devuelve una confirmación. La conexión real con Google Sheets, correo o WhatsApp requiere que el equipo configure sus credenciales dentro de n8n.

El prototipo cubre los objetivos de creación de chatbots, uso de modelos de OpenAI, transcripción con IA, voz en tiempo real, diseño de interfaces y automatización de procesos. La versión web ya queda preparada para despliegue HTTPS en Vercel y mantiene las mismas funciones centrales que la versión Streamlit.

## Introducción

Las actividades académicas producen información en distintos formatos: preguntas escritas, notas de voz, grabaciones de clases, resúmenes y tareas pendientes. Cuando cada elemento se procesa en una herramienta diferente, aumenta el tiempo dedicado a copiar datos, organizar contenidos y ejecutar pasos repetitivos.

NEXORA AI aborda ese problema mediante una interfaz única. El usuario conversa con un asistente, convierte audio en texto y envía contenido estructurado a n8n. El proyecto no pretende reemplazar plataformas empresariales ni ofrecer un servicio público listo para producción. Su finalidad es académica: demostrar una arquitectura funcional, comprensible y segura.

Este documento describe el problema, los objetivos, el alcance, los requisitos, la arquitectura, el funcionamiento, la seguridad, la instalación, el uso, las pruebas, los riesgos y las mejoras. El equipo puede utilizarlo como base para su informe y adaptar los campos institucionales sin modificar la descripción técnica.

## Planteamiento del problema

### Situación problemática

Un estudiante puede necesitar resolver una duda, transcribir una nota de voz y registrar el resultado en otra aplicación. Sin integración, este proceso implica abrir herramientas distintas, repetir información y ejecutar pasos manuales. Las soluciones existentes suelen concentrarse en una sola capacidad o requieren conocimientos técnicos para conectar servicios.

### Problema general

¿Cómo integrar en una aplicación web sencilla las capacidades de conversación, transcripción de audio y automatización de tareas utilizando las API de OpenAI, Streamlit y n8n, manteniendo una separación segura de credenciales?

### Problemas específicos

- La información académica está distribuida entre texto, grabaciones y aplicaciones externas.
- La transcripción manual consume tiempo y puede introducir errores.
- Las tareas repetitivas reducen la productividad.
- Las credenciales pueden exponerse si se escriben directamente en el código.
- Una exposición académica necesita mostrar resultados visibles en pocos minutos.

## Justificación

### Justificación académica

El proyecto aplica consumo de API, programación en Python, diseño de interfaz, manejo de estado, validación de archivos, automatización y seguridad básica. El código y el workflow son suficientemente pequeños para ser explicados, pero integran componentes reales.

### Justificación tecnológica

Streamlit permite construir una interfaz local sin separar frontend y backend. La versión Vercel incorpora HTML, CSS, JavaScript y funciones serverless para habilitar WebRTC en un origen HTTPS. Las API de OpenAI procesan texto, transcripción y audio en tiempo real. n8n aporta una representación visual de los procesos y separa las credenciales externas de la aplicación.

### Justificación práctica

La solución reduce pasos manuales en escenarios como tomar apuntes de voz, resumir una reunión, preparar un correo o registrar una actividad. Aunque el workflow se entrega en modo demostración, la arquitectura permite conectar servicios reales sin rediseñar la aplicación.

## Objetivos

### Objetivo general

Desarrollar una aplicación web de apoyo académico que integre conversación por texto y voz, transcripción de audios y automatización de tareas mediante las API de OpenAI, Streamlit, Vercel y n8n.

### Objetivos específicos

1. Implementar un chatbot contextual con la Responses API de OpenAI.
2. Construir una interfaz clara y responsiva con Streamlit.
3. Permitir grabar o cargar archivos de audio compatibles.
4. Transcribir audio mediante el modelo gpt-transcribe.
5. Generar resúmenes estructurados de las transcripciones.
6. Diseñar un webhook que conecte la aplicación con n8n.
7. Enrutar acciones de Sheets, correo y WhatsApp en un workflow importable.
8. Proteger la clave evitando que sea almacenada en el repositorio.
9. Documentar instalación, funcionamiento, pruebas y mejoras.
10. Desplegar una interfaz minimalista en Vercel con voz en tiempo real mediante WebRTC.
11. Incorporar herramientas guiadas de resumen, corrección, traducción, estudio, evaluación, ideación, email, exposición, código, extracción y análisis.
12. Analizar imágenes con un modelo multimodal y distinguir observaciones de inferencias.
13. Generar imágenes descargables a partir de instrucciones escritas.
14. Convertir resultados en voz sintética con aviso explícito al usuario.
15. Clasificar contenido con un modelo de moderación y presentar un resultado comprensible.

## Alcance

### Funciones incluidas

- Interfaz Streamlit ejecutada localmente e interfaz web desplegable en Vercel.
- Ingreso temporal de la OpenAI API Key.
- Selección manual del modelo de chat.
- Conversación con memoria limitada a la sesión.
- Grabación de audio y carga de formatos compatibles.
- Validación de tamaño máximo de 25 MB.
- Transcripción, resumen y descarga en TXT.
- Reutilización de la transcripción dentro del chat.
- Envío de payloads JSON a n8n.
- Enrutamiento de tres tipos de automatización.
- Scripts para Windows, macOS y Linux.
- Pruebas de humo y documentación académica.
- Conversación de voz a voz, silenciamiento, interrupción y transcripción en vivo.
- Diseño monocromático adaptable con fondo negro y controles accesibles.
- Studio IA con once transformaciones de texto preconfiguradas.
- Análisis visual de imágenes PNG, JPG y WEBP de menos de 4 MB.
- Generación de imágenes cuadradas, horizontales y verticales.
- Narración de resultados con voz generada por IA.
- Moderación de texto mediante categorías de seguridad.

### Funciones fuera del alcance

- Registro e inicio de sesión de usuarios.
- Base de datos persistente.
- Facturación o control automático de costos.
- Envío real sin configurar credenciales externas.
- Cumplimiento normativo para información clínica, legal o financiera.
- Alta disponibilidad o soporte empresarial.

## Usuarios y partes interesadas

| Actor | Necesidad principal | Interacción con el sistema |
|---|---|---|
| Estudiante | Resolver dudas y procesar notas de voz | Utiliza chat, transcripción y resumen |
| Docente | Evaluar la integración tecnológica | Observa demostración, arquitectura y pruebas |
| Integrante técnico | Configurar y mantener el proyecto | Instala, revisa código y conecta servicios |
| Administrador de n8n | Gestionar credenciales y workflows | Importa, activa y amplía la automatización |
| Equipo del proyecto | Preparar documentación y exposición | Utiliza el informe, README y guion |

## Requisitos funcionales

| Código | Requisito | Criterio de aceptación |
|---|---|---|
| RF 01 | Ingresar una API Key | El campo oculto acepta la clave y habilita la IA |
| RF 02 | Configurar el modelo | La interfaz permite escribir el identificador |
| RF 03 | Enviar mensajes | Se visualizan mensaje y respuesta |
| RF 04 | Mantener contexto | Las últimas interacciones pasan a la siguiente solicitud |
| RF 05 | Reiniciar conversación | Nueva charla restablece el historial |
| RF 06 | Grabar audio | El navegador muestra control de grabación |
| RF 07 | Cargar audio | Se aceptan formatos definidos |
| RF 08 | Validar tamaño | Un archivo mayor a 25 MB no se procesa |
| RF 09 | Transcribir audio | El texto resultante aparece en pantalla |
| RF 10 | Descargar texto | Se genera un archivo TXT |
| RF 11 | Generar resumen | Se producen ideas, decisiones y pendientes |
| RF 12 | Reutilizar texto | La transcripción puede añadirse al chat |
| RF 13 | Preparar automatización | Se eligen acción, destinatario, asunto y contenido |
| RF 14 | Mostrar payload | El JSON puede revisarse antes de enviarlo |
| RF 15 | Llamar al webhook | Se ejecuta una solicitud POST |
| RF 16 | Enrutar en n8n | Se distinguen sheet, email y whatsapp |
| RF 17 | Confirmar resultado | La respuesta JSON aparece en Streamlit |
| RF 18 | Iniciar voz en tiempo real | El navegador crea una sesión WebRTC |
| RF 19 | Reproducir la respuesta | El audio del modelo se escucha automáticamente |
| RF 20 | Controlar la llamada | Se puede silenciar y finalizar la sesión |
| RF 21 | Mostrar conversación | Los eventos disponibles forman una transcripción en vivo |
| RF 22 | Mantener paridad web | Chat, grabación, transcripción, resumen, descarga y n8n están disponibles en Vercel |
| RF 23 | Elegir una herramienta textual | Studio IA ofrece once modos con instrucciones especializadas |
| RF 24 | Resumir contenido | Se obtiene idea central y puntos clave |
| RF 25 | Corregir o reescribir | Se produce una versión clara que conserva el significado |
| RF 26 | Traducir contenido | El resultado respeta el idioma solicitado |
| RF 27 | Crear material académico | Se generan guías, exámenes y guiones de exposición |
| RF 28 | Apoyar programación | Se explica, revisa y mejora código suministrado |
| RF 29 | Extraer y analizar | Se estructuran datos, argumentos, riesgos y conclusiones |
| RF 30 | Narrar un resultado | Se reproduce un MP3 con voz IA y aviso visible |
| RF 31 | Analizar una imagen | Se combina una instrucción textual con una imagen válida |
| RF 32 | Previsualizar imagen | La imagen seleccionada se muestra antes del envío |
| RF 33 | Generar una imagen | Se recibe una imagen JPEG descargable en el formato elegido |
| RF 34 | Revisar seguridad | Se informa si el texto fue marcado y qué categorías aplican |
| RF 35 | Conservar interoperabilidad | Los resultados pueden descargarse o continuar en el chat |

## Requisitos no funcionales

| Código | Categoría | Requisito |
|---|---|---|
| RNF 01 | Usabilidad | La navegación debe mostrar cinco áreas principales |
| RNF 02 | Seguridad | Ninguna clave real debe almacenarse en Git |
| RNF 03 | Privacidad | La clave no debe enviarse a n8n |
| RNF 04 | Compatibilidad | Debe funcionar en navegadores modernos |
| RNF 05 | Rendimiento | La navegación no debe bloquearse durante uso normal |
| RNF 06 | Mantenibilidad | La configuración debe usar variables de entorno |
| RNF 07 | Portabilidad | Deben existir instrucciones multiplataforma |
| RNF 08 | Fiabilidad | Las solicitudes deben manejar timeout y errores |
| RNF 09 | Trazabilidad | Requisitos, pruebas y componentes deben documentarse |
| RNF 10 | Accesibilidad básica | Los controles deben tener etiquetas comprensibles |
| RNF 11 | Diseño | La interfaz utiliza negro, blanco y grises sin saturación visual |
| RNF 12 | Despliegue | La versión pública funciona bajo HTTPS en Vercel |
| RNF 13 | Límites | Texto, audio e imágenes se validan antes de llamar a la API |
| RNF 14 | Transparencia | La interfaz identifica explícitamente la voz sintética |
| RNF 15 | Responsabilidad | El análisis visual separa observaciones de inferencias |
| RNF 16 | Extensibilidad | Las herramientas de texto se definen mediante un mapa de modos |

## Casos de uso

### Conversar con NEXORA

**Actor:** usuario. **Precondición:** API key válida y modelo disponible.

1. El usuario abre Chat inteligente y escribe una consulta.
2. La aplicación agrega el mensaje al historial.
3. Streamlit envía instrucciones y contexto a OpenAI.
4. La respuesta aparece dentro del chat.
5. La respuesta se conserva para la siguiente interacción.

Si falta la clave, la app solicita configurarla. Si OpenAI devuelve un error, se muestra sin cerrar la sesión.

### Conversar por voz con NEXORA

**Actor:** usuario. **Precondición:** navegador con micrófono, conexión HTTPS y API key válida.

1. El usuario abre Voz y selecciona Iniciar conversación.
2. El navegador solicita permiso para utilizar el micrófono.
3. Una función serverless crea la sesión Realtime sin exponer la clave en el frontend.
4. El navegador establece WebRTC directamente con OpenAI.
5. El usuario habla y recibe audio generado con baja latencia.
6. Puede interrumpir al modelo, silenciar el micrófono o finalizar la sesión.
7. Los eventos disponibles actualizan la transcripción en vivo.

### Transcribir una nota de voz

1. El usuario abre Transcriptor.
2. Graba audio o selecciona un archivo.
3. La app valida el tamaño.
4. El usuario confirma la transcripción.
5. El audio se envía al endpoint de transcripciones.
6. El texto se muestra y puede descargarse.

### Procesar contenido en Studio IA

**Actor:** usuario. **Precondición:** API key válida.

1. El usuario abre Studio IA y selecciona Texto.
2. Elige uno de los once modos: resumen, reescritura, traducción, estudio, examen, ideas, email, exposición, código, extracción o análisis.
3. Añade opcionalmente un idioma, tono o nivel académico.
4. Pega el contenido y selecciona Procesar con IA.
5. El endpoint aplica una instrucción controlada y llama a Responses API.
6. El resultado puede descargarse, narrarse con voz IA o enviarse al chat para continuar.

### Analizar una imagen

1. El usuario abre Studio IA y selecciona Visión.
2. Carga un PNG, JPG o WEBP de menos de 4 MB y revisa la vista previa.
3. Escribe la pregunta que desea resolver.
4. La función serverless envía texto e imagen al modelo multimodal.
5. La respuesta aparece como texto editable y distingue hechos observables de inferencias.

### Generar una imagen

1. El usuario abre Studio IA y selecciona Imágenes.
2. Describe sujeto, composición, estilo y restricciones.
3. Elige formato cuadrado, horizontal o vertical.
4. La Image API genera un JPEG optimizado para demostración.
5. La interfaz muestra una vista previa y permite descargar el resultado.

### Narrar texto con voz IA

1. El usuario produce un resultado en la herramienta Texto.
2. Selecciona Escuchar con voz IA.
3. El endpoint de Speech convierte hasta 2500 caracteres en MP3 con la voz marin.
4. El navegador reproduce el audio e informa que la voz es sintética.

### Revisar seguridad de contenido

1. El usuario abre Seguridad y pega el texto.
2. El endpoint llama al modelo omni-moderation-latest.
3. La interfaz indica si el texto fue marcado.
4. Cuando corresponde, muestra las categorías detectadas para revisión humana.

### Crear apuntes desde un audio

1. El usuario completa una transcripción.
2. Selecciona Crear resumen.
3. La app solicita idea central, puntos clave, decisiones y pendientes.
4. El resultado aparece debajo de la transcripción.
5. Puede utilizarse en el chat o enviarse a n8n.

### Ejecutar una automatización

1. El usuario selecciona Sheets, email o WhatsApp.
2. Completa destinatario, asunto y contenido.
3. Revisa el payload JSON y confirma.
4. Streamlit o la función serverless envía una solicitud POST.
5. n8n valida y enruta la acción.
6. n8n devuelve una confirmación.

## Arquitectura de la solución

```text
Usuario
  │ navegador
  ├── Streamlit local
  │    ├── Chat y transcripción
  │    ├── Resumen y descarga
  │    └── Automatización n8n
  │
  └── Interfaz Vercel
       ├── HTML CSS JavaScript
       ├── Funciones serverless
       │    ├── Responses API
       │    ├── Transcriptions API
       │    ├── Speech API
       │    ├── Image API
       │    ├── Moderations API
       │    ├── Entrada multimodal de visión
       │    └── Proxy controlado hacia n8n
       └── WebRTC directo con OpenAI Realtime API

n8n
  ├── Validación
  ├── Enrutamiento
  └── Sheets Email WhatsApp
```

### Componentes

| Componente | Responsabilidad |
|---|---|
| Interfaz Streamlit | Renderizar vistas, recibir datos y mantener la sesión |
| Interfaz Vercel | Ofrecer la experiencia pública minimalista y responsiva |
| Endpoint Realtime | Crear la sesión WebRTC con la clave en el servidor |
| Funciones serverless | Proteger credenciales y llamar a OpenAI o n8n |
| Módulo de chat | Preparar contexto y consumir Responses API |
| Módulo de audio | Validar y consumir Transcriptions API |
| Módulo de resumen | Estructurar el contenido transcrito |
| Studio IA | Exponer once flujos textuales guiados y reutilizables |
| Módulo de visión | Validar y analizar imágenes con Responses API |
| Módulo de imágenes | Generar JPEG descargable con GPT Image |
| Módulo de voz sintética | Convertir texto en MP3 con Speech API |
| Módulo de moderación | Clasificar contenido potencialmente riesgoso |
| Módulo de automatización | Construir payload y ejecutar POST |
| Workflow n8n | Validar, normalizar, enrutar y responder |
| Configuración | Definir tema, dependencias y variables |

### Decisiones de diseño

Se mantiene una arquitectura monolítica ligera en Streamlit para ejecución local y se añade una arquitectura serverless para publicación. Vercel sirve la interfaz estática y ejecuta endpoints especializados que conservan la clave estándar fuera del JavaScript. La separación entre chat, Studio, visión, imágenes, voz sintética, transcripción, moderación, Realtime y n8n facilita pruebas, límites por modalidad y evolución independiente. En voz, el endpoint crea la sesión y el navegador transporta audio por WebRTC, lo que reduce latencia. n8n permanece desacoplado mediante HTTP, por lo que el workflow puede cambiar sin modificar los módulos de IA.

El historial se limita a los últimos mensajes para reducir el contexto. La clave puede escribirse temporalmente o cargarse desde el entorno. La primera opción facilita la exposición y la segunda es adecuada para un despliegue controlado.

## Tecnologías y organización

| Tecnología | Responsabilidad |
|---|---|
| Python | Lógica, validación y comunicación con APIs |
| Streamlit | Interfaz, chat, audio y estado |
| HTML CSS JavaScript | Interfaz web minimalista y controles del navegador |
| Vercel | Hosting HTTPS y funciones serverless |
| WebRTC | Transporte bidireccional de audio en tiempo real |
| Realtime API | Conversación de voz a voz |
| Responses API | Chat, herramientas de texto y visión |
| Speech API | Conversión de texto en audio MP3 |
| Image API | Generación de imágenes desde texto |
| Moderations API | Clasificación de seguridad de contenido |
| OpenAI SDK | Cliente local de Responses y Transcriptions |
| n8n | Workflow y conectores externos |
| Requests | Solicitud POST al webhook |
| Docker Compose | Instancia local de n8n |
| Pytest | Pruebas automáticas de humo |

| Ruta | Contenido |
|---|---|
| app.py | Página, tema, estado, API, vistas y navegación |
| public | Interfaz Vercel de voz, chat, Studio IA, transcripción y automatización |
| api | Endpoints serverless para texto, visión, imágenes, voz, moderación, Realtime, audio y n8n |
| vercel.json | Rutas, funciones y cabeceras del despliegue |
| package.json | Metadatos y validación de JavaScript |
| assets/nexora-icon.png | Identidad visual |
| automations/nexora-n8n.json | Workflow importable |
| .streamlit/config.toml | Tema y límite de carga |
| .env.example | Variables sin secretos reales |
| requirements.txt | Dependencias Python |
| docker-compose.yml | Servicio n8n |
| run.sh y run.bat | Instalación y arranque |
| tests/test_smoke.py | Pruebas básicas |
| scripts/build_documentation.py | Generador reproducible del documento Word |

## Funcionamiento interno

### Inicialización y estado

Streamlit configura el título, icono y diseño ancho. `inject_theme` incorpora estilos y animaciones. `init_state` crea el historial inicial, transcripción, estado de API y contador de solicitudes.

### Credenciales

`get_client` prioriza la clave escrita en Streamlit y utiliza `OPENAI_API_KEY` como alternativa. En Vercel, los endpoints priorizan la variable cifrada y aceptan una clave temporal enviada por HTTPS para la demostración. La clave se conserva solamente en memoria, nunca se agrega al historial ni al payload de n8n y no se retorna al navegador.

### Voz en tiempo real

El navegador obtiene el micrófono con `getUserMedia`, crea un `RTCPeerConnection` y genera una oferta SDP. El endpoint `/api/realtime-session` envía esa oferta y la configuración de sesión a OpenAI mediante `/v1/realtime/calls`. La respuesta SDP completa la conexión. El audio se transporta por WebRTC y un canal de datos recibe eventos de turnos y transcripción. La sesión utiliza `gpt-realtime-2.1`, la voz `marin`, detección de turnos del servidor e instrucciones en español.

### Chat

`chat` recibe cliente, modelo e historial. Envía instrucciones orientadas al apoyo académico y limita el contexto a las últimas catorce entradas. Después de una respuesta incrementa el contador.

```python
response = client.responses.create(
    model=model,
    instructions=SYSTEM_PROMPT,
    input=messages,
)
texto = response.output_text
```

### Transcripción

`transcribe` construye una tupla con nombre, bytes y tipo MIME. `gpt-transcribe` devuelve un objeto cuyo texto se presenta al usuario.

```python
result = client.audio.transcriptions.create(
    model="gpt-transcribe",
    file=payload,
)
texto = result.text
```

### Studio IA y texto especializado

`/api/studio` valida el modo, aplica una instrucción específica y envía el contenido a Responses API. Los once modos están centralizados en un mapa para impedir instrucciones arbitrarias del servidor y facilitar futuras ampliaciones. El contenido se limita a 30 000 caracteres. El resultado puede descargarse, reutilizarse en el chat o narrarse.

### Visión

`/api/vision` acepta PNG, JPG o WEBP de menos de 4 MB. La imagen se codifica en base64 en el navegador y se combina con una pregunta como contenido multimodal de Responses API. Las instrucciones exigen distinguir observaciones de inferencias para reducir afirmaciones no sustentadas.

### Generación de imágenes

`/api/image` usa Image API con `gpt-image-2.5-flare`, calidad baja para una demostración económica, compresión JPEG y tres formatos. Devuelve base64 al navegador, donde se presenta una vista previa y un enlace de descarga. El acceso a modelos de imagen puede requerir verificación de la organización.

### Texto a voz

`/api/speech` envía hasta 2500 caracteres a `gpt-4o-mini-tts` con la voz `marin` y devuelve MP3 sin almacenarlo. La interfaz informa que el audio es generado por IA, reproduce el archivo y lo libera al cerrar la pestaña.

### Moderación

`/api/moderate` usa `omni-moderation-latest`. La respuesta pública se reduce a un indicador y las categorías positivas; no se muestran puntuaciones que puedan interpretarse como certezas. El resultado apoya una revisión humana y no sustituye una política institucional.

### Catálogo de endpoints serverless

| Ruta | Función | API externa |
|---|---|---|
| `/api/chat` | Conversación contextual | Responses |
| `/api/studio` | Once transformaciones textuales | Responses |
| `/api/vision` | Análisis multimodal | Responses |
| `/api/image` | Generación visual | Images |
| `/api/speech` | Narración MP3 | Audio Speech |
| `/api/moderate` | Clasificación de seguridad | Moderations |
| `/api/transcribe` | Audio a texto | Audio Transcriptions |
| `/api/realtime-session` | Negociación de voz a voz | Realtime WebRTC |
| `/api/automation` | Proxy validado | Webhook n8n |

### Automatización

La vista crea un diccionario con acción, destinatario, asunto, contenido, origen y fecha. `requests.post` envía el JSON con timeout de quince segundos. Los errores de red se capturan y presentan sin detener la app.

## Integración con n8n

| Nodo | Función |
|---|---|
| Entrada NEXORA | Recibe POST en la ruta nexora |
| Validar y normalizar | Verifica acción y contenido |
| Enrutar acción | Separa sheet, email y whatsapp |
| DEMO Google Sheets | Simula un registro |
| DEMO Enviar email | Simula un correo |
| DEMO WhatsApp | Simula un mensaje |
| Confirmar a la app | Devuelve JSON |

```json
{
  "action": "sheet",
  "recipient": "registro académico",
  "subject": "Resumen de clase",
  "content": "Texto que debe procesar el flujo",
  "source": "NEXORA AI",
  "timestamp": "2026-09-23T20:30:00"
}
```

### Activación de integraciones reales

**Google Sheets:** crear columnas, configurar credenciales, reemplazar el nodo DEMO por Append Row y mapear los campos.  
**Correo:** elegir Gmail, Outlook o SMTP; mapear destinatario, asunto y cuerpo; añadir aprobación humana.  
**WhatsApp:** disponer de WhatsApp Business Cloud o Twilio, validar número, mapear contenido y cumplir reglas de consentimiento.

## Seguridad y privacidad

### Activos protegidos

- OpenAI API Key y credenciales externas.
- Audios, transcripciones y resúmenes.
- Imágenes cargadas, prompts, resultados generados y narraciones.
- URL de webhooks productivos.

### Controles implementados

- `.env` y secretos excluidos mediante `.gitignore`.
- Campo de API key oculto.
- Separación entre credenciales de OpenAI y n8n.
- Validación de tamaño y formatos.
- Listas permitidas para modos, tamaños y tipos MIME.
- Límite de caracteres para texto y narración.
- Divulgación visible de voz generada por IA.
- Timeout y manejo de errores.
- Workflow de demostración sin efectos externos.

### Controles recomendados

- Gestor de secretos y HTTPS.
- Autenticación o firma del webhook.
- Control de acceso por usuario.
- Retención definida para audios.
- Limitación de solicitudes y monitoreo de costos.
- Confirmación antes de acciones externas.
- Rotación periódica de credenciales.

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Publicación de la API key | Media | Alto | Gitignore, revisión y rotación |
| Uso no autorizado del webhook | Media | Medio | Autenticación o red privada |
| Envío de datos sensibles | Media | Alto | Avisos y minimización |
| Costos inesperados | Media | Medio | Límites y monitoreo |
| Audio excesivo | Baja | Medio | Validación de 25 MB |
| Imagen excesiva o inválida | Media | Medio | Límite de 4 MB y lista MIME |
| Contenido generado incorrecto | Media | Alto | Revisión humana y aviso de limitaciones |
| Mayor consumo por imágenes o voz | Media | Medio | Calidad baja, límites y demostraciones cortas |
| Error de servicio | Media | Medio | Timeout y manejo controlado |

## Instalación

### Requisitos previos

- Python 3.10 o superior.
- OpenAI API Key válida.
- Docker Desktop si se utilizará n8n local.

### macOS y Linux

```bash
git clone https://github.com/itslevanx/NexoraAI.git
cd NexoraAI
chmod +x run.sh
./run.sh
```

### Windows

```bat
git clone https://github.com/itslevanx/NexoraAI.git
cd NexoraAI
run.bat
```

### Inicio manual

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
streamlit run app.py
```

### Despliegue en Vercel

1. Importar `itslevanx/NexoraAI` en Vercel.
2. Seleccionar Other como preset y mantener el directorio raíz.
3. Configurar `OPENAI_API_KEY` y, opcionalmente, `N8N_WEBHOOK_URL` en Environment Variables.
4. Desplegar y abrir `https://nexora-ai-blue-three.vercel.app/`.
5. Autorizar el micrófono y comprobar Voz, Chat, Studio IA, Transcribir y Automatizar.

La versión serverless limita los audios codificados a menos de 4 MB. Streamlit mantiene el límite local de 25 MB.

| Variable | Obligatoria | Propósito |
|---|---|---|
| OPENAI_API_KEY | No si se ingresa en la interfaz | Autenticar OpenAI |
| OPENAI_MODEL | No | Modelo inicial del chat |
| N8N_WEBHOOK_URL | No | Prellenar webhook |

## Manual de usuario

### Conectar OpenAI

1. Abrir `http://localhost:8501`.
2. Pegar una clave válida en la barra lateral.
3. Mantener o cambiar el modelo.
4. Verificar el estado API configurada.

La clave no debe proyectarse. Se recomienda pegarla antes de compartir pantalla o cubrir la barra lateral.

### Usar el chat

1. Seleccionar Chat inteligente.
2. Escribir la consulta y esperar la respuesta.
3. Continuar con preguntas relacionadas.
4. Usar Nueva charla para limpiar el contexto.

### Conversar por voz

1. Abrir la URL de Vercel y seleccionar Voz.
2. Conectar la API key desde Configuración o utilizar la variable del servidor.
3. Pulsar Iniciar conversación y permitir el micrófono.
4. Hablar con naturalidad; el modelo responde por audio.
5. Utilizar Silenciar o Finalizar cuando corresponda.

### Usar Studio IA

1. Abrir Studio IA y elegir Texto, Visión, Imágenes o Seguridad.
2. En Texto, seleccionar una herramienta, añadir una instrucción opcional y pegar contenido.
3. Procesar el resultado y elegir escuchar, descargar o continuar en el chat.
4. En Visión, subir una imagen menor de 4 MB, revisar la vista previa y formular una pregunta.
5. En Imágenes, describir el resultado, elegir su formato y descargar el JPEG.
6. En Seguridad, pegar texto y revisar el indicador y las categorías sin asumir que sustituyen juicio humano.

El uso de visión e imágenes implica enviar esos datos a OpenAI. No deben cargarse imágenes privadas, identificables o confidenciales durante la exposición.

### Transcribir audio

1. Seleccionar Transcriptor.
2. Elegir Grabar ahora o Subir archivo.
3. Revisar el audio y pulsar Transcribir con IA.
4. Descargar el texto, crear un resumen o enviarlo al chat.

### Ejecutar automatizaciones

1. Configurar el webhook en la barra lateral.
2. Abrir Automatizaciones y elegir una acción.
3. Escribir destinatario, asunto y contenido.
4. Revisar el payload y confirmar.
5. Verificar la respuesta y ejecución en n8n.

## Plan de pruebas

Las pruebas automáticas no consumen OpenAI para evitar costos y dependencia de credenciales. Las pruebas reales deben ejecutarse con una cuenta controlada.

| Código | Prueba | Resultado esperado | Estado |
|---|---|---|---|
| CP 01 | Inicio sin clave | Aviso para conectar | Aprobado |
| CP 02 | Archivos esenciales | Todos existen | Aprobado |
| CP 03 | Workflow JSON | Válido y con nodos | Aprobado |
| CP 04 | Sintaxis Python | Sin errores | Aprobado |
| CP 05 | Render de inicio | Portada y navegación visibles | Aprobado |
| CP 06 | Navegación | Todas las vistas cargan | Aprobado |
| CP 07 | Chat sin clave | Advertencia, sin llamada | Aprobado |
| CP 08 | Chat con clave | Respuesta visible | Pendiente de clave del equipo |
| CP 09 | Audio mayor a 25 MB | Error, sin solicitud | Preparado |
| CP 10 | Audio válido | Transcripción visible | Pendiente de clave del equipo |
| CP 11 | Webhook ausente | Solicita URL | Aprobado |
| CP 12 | Webhook demo | Confirmación JSON | Pendiente de n8n activo |
| CP 13 | Acción inválida | Error de validación | Preparado |
| CP 14 | Clave fuera de Git | No existe secreto | Aprobado |
| CP 15 | Sintaxis JavaScript | Todos los archivos pasan `node --check` | Aprobado |
| CP 16 | Interfaz Safari | Diseño monocromático y navegación visibles | Aprobado |
| CP 17 | Voz WebRTC | Audio bidireccional | Pendiente de clave del equipo |
| CP 18 | Paridad Vercel | Chat, grabación, resumen, descarga y n8n disponibles | Aprobado |
| CP 19 | Modos de Studio | Los once modos aparecen y envían un modo permitido | Aprobado |
| CP 20 | Imagen mayor de 4 MB | Se rechaza antes de la solicitud | Preparado |
| CP 21 | Visión válida | Análisis textual visible | Pendiente de clave del equipo |
| CP 22 | Generación visual | JPEG visible y descargable | Pendiente de acceso al modelo |
| CP 23 | Narración | MP3 reproducible con aviso de voz IA | Pendiente de clave del equipo |
| CP 24 | Moderación | Resultado y categorías visibles | Pendiente de clave del equipo |
| CP 25 | Endpoints nuevos | Todos pasan `node --check` y existen en pruebas | Aprobado |

```bash
python -m pytest -q
python -m py_compile app.py
npm run check
git status --short
```

### Criterios de aceptación

- La aplicación inicia sin errores y ninguna clave real aparece en Git.
- Las cinco áreas son accesibles.
- La versión Vercel conserva las funciones centrales y añade voz en tiempo real y Studio IA multimodal.
- Chat y transcripción solicitan una clave cuando falta.
- n8n acepta y enruta las tres acciones.
- Los errores de red se muestran de forma controlada.
- El equipo puede ejecutar el guion completo.

## Riesgos operativos

| Riesgo | Consecuencia | Respuesta |
|---|---|---|
| Falta de saldo | La demo no responde | Verificar cuenta antes de exponer |
| Modelo no disponible | Error en chat | Cambiar modelo en la barra lateral |
| Micrófono bloqueado | No se graba | Usar audio preparado |
| Docker no inicia | n8n no abre | Usar instancia o video de respaldo |
| Internet inestable | Respuestas fallidas | Tener capturas y video |
| Clave visible | Consumo no autorizado | Ocultar y rotar después |
| Workflow inactivo | Error 404 | Activar y comprobar URL |
| Modelo de imagen restringido | Generación no disponible | Verificar organización o explicar la dependencia |
| Respuesta multimodal incorrecta | Interpretación equivocada | Reformular y contrastar con la fuente |
| Respuesta serverless grande | Error de plataforma | Mantener compresión, calidad baja y límites |

## Estrategia de demostración

- **Minuto 1:** problema, nombre e interfaz minimalista.
- **Minuto 2:** conversación de voz a voz.
- **Minuto 3:** Studio IA: guía de estudio, análisis visual o generación de imagen.
- **Minuto 4:** grabación, transcripción, resumen, descarga y narración.
- **Minuto 5:** ejecución en n8n, arquitectura, moderación y seguridad.

Consulta sugerida: “Explica la computación cuántica con una analogía sencilla, resume la idea en cinco puntos y crea tres preguntas de repaso”.

Nota de voz: “La reunión del equipo será el viernes a las cuatro. Debemos terminar la presentación, revisar las pruebas y asignar quién explicará la automatización”.

El resultado clave es que la información pasa de voz a texto, de texto a resumen y de resumen a automatización sin copiarla entre herramientas.

## Organización del equipo

| Rol | Responsabilidades sugeridas |
|---|---|
| Coordinación | Controlar tiempos y consolidar entrega |
| Desarrollo | Explicar app.py y APIs |
| Automatización | Configurar y demostrar n8n |
| Calidad | Ejecutar pruebas y reunir evidencias |
| Documentación | Completar carátula, Word y referencias |
| Exposición | Preparar guion y respaldos |

### Evidencias necesarias

- Pantalla principal, chat, Studio IA, transcripción y resumen.
- Conversación de voz a voz y URL pública de Vercel.
- Resultado de visión, imagen generada, narración y moderación.
- Workflow completo y ejecución exitosa en n8n.
- Resultado de pytest.
- Historial de commits atómicos.
- URL del repositorio.

## Limitaciones y mejoras futuras

La aplicación no persiste conversaciones ni archivos. El modo demostración de n8n no crea efectos externos. La precisión depende del modelo, el audio, la imagen y las instrucciones. El proyecto no verifica hechos de manera independiente y el consumo puede generar costos. La conversación de voz necesita HTTPS, permiso de micrófono y acceso al modelo Realtime. La versión Vercel limita cada audio o imagen codificada a menos de 4 MB. La narración acepta hasta 2500 caracteres por solicitud y la generación de imágenes puede requerir verificación de la organización de OpenAI. La moderación es una señal de apoyo y no una decisión definitiva.

Mejoras propuestas: usuarios y roles; persistencia con PostgreSQL o Supabase; búsqueda semántica y documentos PDF; edición iterativa de imágenes; respuestas en streaming; métricas de tokens y costos; firma HMAC para el webhook; aprobación de acciones; plantillas por curso; caché de resultados; y pruebas end to end.

## Conclusiones

NEXORA AI demuestra que se pueden integrar lenguaje, visión, generación de imágenes, voz sintética, conversación de voz, transcripción, moderación y automatización en una aplicación compacta. Streamlit mantiene una versión local fácil de explicar; Vercel publica la suite minimalista bajo HTTPS; OpenAI procesa distintas modalidades; y n8n representa las acciones externas.

El proyecto evidencia que una integración responsable requiere validar entradas, manejar errores, separar credenciales, limitar el alcance y documentar los pasos. El modo demostración permite enseñar el flujo sin enviar comunicaciones por accidente.

La solución queda preparada para evolucionar. La persistencia, autenticación, monitoreo y aprobación permitirían convertir el prototipo en una herramienta de uso continuo.

## Recomendaciones

- Probar la demostración un día antes.
- Utilizar una clave exclusiva y rotarla después.
- Preparar un audio y video de respaldo.
- No afirmar que un servicio está conectado si continúa en modo DEMO.
- Registrar únicamente pruebas realizadas.
- Mantener documentación y código sincronizados.

## Glosario

| Término | Definición |
|---|---|
| API | Interfaz para intercambiar solicitudes y respuestas |
| API key | Credencial de autenticación de una API |
| Chatbot | Aplicación que mantiene una conversación |
| Contexto | Mensajes utilizados por el modelo para responder |
| Endpoint | Dirección de una operación de API |
| JSON | Formato estructurado de datos |
| Modelo | Sistema de IA que procesa una solicitud |
| Payload | Datos enviados en una solicitud HTTP |
| Prompt | Instrucción entregada al modelo |
| Streamlit | Framework para aplicaciones de datos e IA |
| Realtime API | API para interacción multimodal de baja latencia |
| Multimodal | Capacidad de procesar más de un tipo de información, como texto, audio e imagen |
| Visión artificial | Interpretación de contenido visual mediante un modelo |
| Texto a voz | Conversión de texto escrito en audio sintético |
| Moderación | Clasificación de contenido según categorías de seguridad |
| Base64 | Representación textual de datos binarios para su transporte |
| Vercel | Plataforma de hosting y funciones serverless |
| WebRTC | Protocolo de comunicación de audio en tiempo real |
| Transcripción | Conversión de voz en texto |
| Webhook | URL que recibe eventos mediante HTTP |
| Workflow | Secuencia automatizada de tareas |

## Bibliografía

OpenAI. Developer quickstart. https://developers.openai.com/api/docs/quickstart  
OpenAI. File transcription. https://developers.openai.com/api/docs/guides/speech-to-text  
OpenAI. Voice agents with WebRTC. https://developers.openai.com/api/docs/guides/voice-webrtc
OpenAI. Images and vision. https://developers.openai.com/api/docs/guides/images-vision
OpenAI. Image generation. https://developers.openai.com/api/docs/guides/image-generation
OpenAI. Text to speech. https://developers.openai.com/api/docs/guides/text-to-speech
OpenAI. Moderation. https://developers.openai.com/api/docs/guides/moderation
Streamlit. Documentation. https://docs.streamlit.io/  
Vercel. Documentation. https://vercel.com/docs
n8n. Documentation. https://docs.n8n.io/  
Docker. Docker Compose documentation. https://docs.docker.com/compose/  
Python Software Foundation. Python documentation. https://docs.python.org/3/

## Anexo A Variables de entorno

```dotenv
OPENAI_API_KEY=sk-proj-reemplazar
OPENAI_MODEL=gpt-5-mini
N8N_WEBHOOK_URL=http://localhost:5678/webhook/nexora
```

## Anexo B Solución de problemas

| Problema | Causa posible | Solución |
|---|---|---|
| Streamlit no encontrado | Entorno no activado | Activar `.venv` o usar el script |
| Error de autenticación | Clave inválida | Utilizar una clave válida |
| Modelo no encontrado | Falta de acceso | Cambiar modelo |
| Audio rechazado | Formato o tamaño | Convertir o reducir a 25 MB |
| Webhook 404 | Workflow inactivo | Activar y copiar URL correcta |
| n8n no abre | Docker o puerto | Iniciar Docker y revisar 5678 |
| Respuesta lenta | Red o audio largo | Esperar o reducir archivo |
| Mensaje no enviado | Nodo DEMO | Configurar credenciales y nodo real |
| Voz no inicia | Micrófono bloqueado o modelo sin acceso | Autorizar Safari y verificar la cuenta |
| Vercel muestra 401 | Variable y clave temporal ausentes | Configurar `OPENAI_API_KEY` o pegarla en Configuración |
| Audio web rechazado | Archivo mayor de 4 MB | Reducir el archivo o usar Streamlit local |
| Imagen rechazada | Formato o tamaño no permitido | Usar PNG, JPG o WEBP de menos de 4 MB |
| Imagen no se genera | Acceso, saldo o verificación | Revisar la cuenta y el modelo disponible |
| Narración no reproduce | Autoplay o texto demasiado largo | Pulsar reproducción o reducir a 2500 caracteres |
| Moderación marca contenido | Categoría sensible detectada | Revisar manualmente y aplicar la política del equipo |

## Anexo C Lista de verificación

- [ ] Completar carátula e integrantes.
- [ ] Insertar capturas reales.
- [ ] Confirmar que no exista una API key.
- [ ] Ejecutar pruebas y registrar resultado.
- [ ] Verificar la URL del repositorio.
- [ ] Ensayar con cronómetro.
- [ ] Preparar audio y video de respaldo.
- [ ] Preparar una imagen de prueba sin datos personales.
- [ ] Comprobar Studio IA, voz sintética y moderación con la clave del equipo.
- [ ] Revisar ortografía y formato institucional.
- [ ] Entregar el Word o PDF solicitado.

## Anexo D Trazabilidad

| Objetivo | Requisito | Evidencia |
|---|---|---|
| Implementar chatbot | RF 01 a RF 05 | Vista Chat y función chat |
| Transcribir audio | RF 06 a RF 10 | Vista Transcriptor y función transcribe |
| Generar apuntes | RF 11 y RF 12 | Botones de resumen y chat |
| Automatizar | RF 13 a RF 17 | Workflow y vista Automatizaciones |
| Conversar por voz | RF 18 a RF 21 | Vista Voz, WebRTC y Realtime API |
| Mantener paridad web | RF 22 | Vistas y controles equivalentes en Vercel |
| Incorporar herramientas textuales | RF 23 a RF 29 | Studio IA y endpoint studio |
| Narrar resultados | RF 30 | Speech API, reproductor y aviso |
| Analizar imágenes | RF 31 y RF 32 | Vista Visión y endpoint vision |
| Generar imágenes | RF 33 | Vista Imágenes y endpoint image |
| Revisar seguridad | RF 34 | Vista Seguridad y endpoint moderate |
| Reutilizar resultados | RF 35 | Descarga y transferencia al chat |
| Proteger credenciales | RNF 02 y RNF 03 | Gitignore y separación de servicios |
| Documentar y probar | RNF 09 | README, informe, pytest y revisión visual |
