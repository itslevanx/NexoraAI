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

NEXORA AI es una suite web multimodal de apoyo académico y productividad con dos interfaces complementarias: una versión local en Python y Streamlit y una versión desplegable en Vercel. Integra chat contextual, once herramientas especializadas de texto, visión artificial, generación de imágenes, publicidad audiovisual, texto a voz, moderación, conversación de voz a voz mediante Realtime API y WebRTC, transcripción de audio y automatizaciones conectadas a n8n. El propósito es demostrar cómo una experiencia unificada puede procesar texto, voz e imágenes y entregar datos estructurados a flujos externos sin incrustar credenciales sensibles en el código.

La persona usuaria puede pegar temporalmente una OpenAI API Key, seleccionar un modelo disponible, conversar por texto o voz, transformar contenido, crear guías y evaluaciones, analizar una imagen, generar una pieza visual, tomar o cargar una foto y convertirla en un video UTP con música, escuchar una narración sintética, revisar contenido potencialmente riesgoso, grabar o cargar un audio, generar un resumen, descargar resultados y activar una automatización. El ecosistema funciona localmente en Docker sin suscripción a n8n Cloud: cinco workflows validan y priorizan solicitudes, crean sesiones de estudio adaptativas, convierten reuniones en actas, redactan patrones sensibles y consolidan métricas. Las comunicaciones externas permanecen pendientes de aprobación hasta que el equipo configure credenciales propias.

El prototipo cubre los objetivos de creación de chatbots, uso de modelos de OpenAI, transcripción con IA, voz en tiempo real, diseño de interfaces y automatización de procesos. La versión web ya queda preparada para despliegue HTTPS en Vercel y mantiene las mismas funciones centrales que la versión Streamlit.

![Panorama visual de las seis áreas de NEXORA AI](docs/images/experiencia-multimodal.png)

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

La solución reduce pasos manuales en escenarios como tomar apuntes de voz, resumir una reunión, preparar un correo, organizar una sesión de estudio o registrar una actividad. El workflow local produce resultados útiles sin depender de una cuenta de pago y permite conectar servicios reales sin rediseñar la aplicación.

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
7. Procesar seis acciones locales: registro, correo, WhatsApp, tareas, estudio y calendario.
8. Proteger la clave evitando que sea almacenada en el repositorio.
9. Documentar instalación, funcionamiento, pruebas y mejoras.
10. Desplegar una interfaz minimalista en Vercel con voz en tiempo real mediante WebRTC.
11. Incorporar herramientas guiadas de resumen, corrección, traducción, estudio, evaluación, ideación, email, exposición, código, extracción y análisis.
12. Analizar imágenes con un modelo multimodal y distinguir observaciones de inferencias.
13. Generar imágenes descargables a partir de instrucciones escritas.
14. Convertir resultados en voz sintética con aviso explícito al usuario.
15. Clasificar contenido con un modelo de moderación y presentar un resultado comprensible.
16. Implementar cuatro workflows avanzados adicionales para estudio, reuniones, privacidad y métricas.
17. Incorporar un creador de publicidad que acepte cámara o archivo y produzca videos de 10 a 30 segundos.
18. Mantener la fotografía y el archivo final dentro del navegador y enviar a OpenAI sólo el enfoque textual.
19. Generar una banda sonora original, formatos 9:16 y 16:9 y descarga MP4 o WebM según el navegador.

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
- Seis tipos de automatización local con prioridad y bitácora persistente.
- Cinco workflows n8n publicados y probados sin dependencia de n8n Cloud.
- Scripts para Windows, macOS y Linux.
- Pruebas de humo y documentación académica.
- Conversación de voz a voz, silenciamiento, interrupción y transcripción en vivo.
- Diseño monocromático adaptable con fondo negro y controles accesibles.
- Studio IA con once transformaciones de texto preconfiguradas.
- Análisis visual de imágenes PNG, JPG y WEBP de menos de 4 MB.
- Generación de imágenes cuadradas, horizontales y verticales.
- Narración de resultados con voz generada por IA.
- Moderación de texto mediante categorías de seguridad.
- Creador de Publicidad UTP con cámara o carga de JPG, PNG y WEBP de hasta 10 MB.
- Opciones de 10 segundos, 15 segundos, 20 segundos o 30 segundos y formatos vertical 9:16 u horizontal 16:9.
- Microguion generado con OpenAI, composición local con Canvas, música Web Audio y descarga mediante MediaRecorder.

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
| RF 16 | Enrutar en n8n | Se distinguen sheet, email, whatsapp, task, study y calendar |
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
| RF 36 | Capturar una foto | El navegador abre la cámara con permiso explícito y permite tomar una imagen |
| RF 37 | Cargar una foto | Se aceptan JPG, PNG o WEBP de hasta 10 MB y se muestra una vista previa |
| RF 38 | Configurar la campaña | Se eligen enfoque, tono, formato y una duración entre 10 y 30 segundos |
| RF 39 | Redactar el microguion | OpenAI devuelve titular, mensaje de apoyo y llamada a la acción controlados |
| RF 40 | Componer el video | Canvas aplica movimiento, transiciones, identidad UTP y textos sincronizados |
| RF 41 | Generar música | Web Audio sintetiza una banda sonora incluida en el archivo final |
| RF 42 | Exportar video | MediaRecorder produce un MP4 o WebM reproducible y descargable |
| RF 43 | Proteger la fotografía | La foto y el video permanecen en el dispositivo; sólo se envía texto al servidor |

## Requisitos no funcionales

| Código | Categoría | Requisito |
|---|---|---|
| RNF 01 | Usabilidad | La navegación debe mostrar seis áreas principales |
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
| RNF 17 | Privacidad audiovisual | La foto y el video publicitario no deben salir del navegador |
| RNF 18 | Compatibilidad multimedia | La exportación debe seleccionar un contenedor admitido por MediaRecorder |

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

### Crear un video publicitario UTP

**Actor:** usuario. **Precondición:** navegador reciente con Canvas, Web Audio y MediaRecorder; permiso de cámara únicamente si se desea tomar la foto.

1. El usuario abre Publicidad y toma una foto o carga un JPG, PNG o WEBP de hasta 10 MB.
2. Añade un enfoque opcional y selecciona tono, formato vertical u horizontal y una duración de 10, 15, 20 o 30 segundos.
3. `/api/publicidad` envía solamente el enfoque textual a OpenAI y recibe un titular, un mensaje de apoyo y una llamada a la acción.
4. El navegador aplica movimiento de cámara, transiciones, textos UTP y una barra temporal sobre la fotografía.
5. Web Audio sintetiza la música y MediaRecorder combina las pistas de video y audio.
6. El resultado se reproduce en la interfaz y puede descargarse como MP4 o WebM.

Si OpenAI no está disponible, el navegador utiliza un microguion institucional seguro y mantiene operativa la exportación. La fotografía y el video no se transmiten a Vercel ni a OpenAI.

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

1. El usuario selecciona registro, email, WhatsApp, tareas, estudio o calendario.
2. Completa destinatario, asunto y contenido.
3. Revisa el payload JSON y confirma.
4. Streamlit o la función serverless envía una solicitud POST.
5. n8n valida el contenido, calcula la prioridad y registra el evento en una bitácora JSONL.
6. n8n devuelve un resultado útil: registro, borrador, checklist, sesión de estudio o evento.

## Arquitectura de la solución

![Arquitectura técnica de NEXORA AI](docs/images/arquitectura-nexora.png)

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
       ├── Publicidad local con Canvas Web Audio y MediaRecorder
       ├── Funciones serverless
       │    ├── Responses API
       │    ├── Transcriptions API
       │    ├── Speech API
       │    ├── Image API
       │    ├── Moderations API
       │    ├── Entrada multimodal de visión
       │    ├── Responses API para microguion publicitario
       │    └── Proxy controlado hacia n8n
       └── WebRTC directo con OpenAI Realtime API

n8n
  ├── Validación
  ├── Priorización
  ├── Bitácora JSONL
  └── Registros Borradores Tareas Estudio Calendario
```

![Arquitectura de privacidad y composición del módulo Publicidad](docs/images/arquitectura-publicidad.png)

La lámina anterior separa dos recorridos. El enfoque textual pasa por la función serverless y OpenAI para producir un microguion. La fotografía permanece en el navegador y se combina con ese texto, una animación Canvas y música Web Audio. MediaRecorder genera el archivo final sin subir la imagen ni el video a un almacenamiento externo.

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
| Módulo de publicidad | Capturar o cargar una foto, solicitar el microguion y componer un video con música en el navegador |
| Módulo de voz sintética | Convertir texto en MP3 con Speech API |
| Módulo de moderación | Clasificar contenido potencialmente riesgoso |
| Módulo de automatización | Construir payload y ejecutar POST |
| Workflow n8n | Validar, normalizar, enrutar y responder |
| Configuración | Definir tema, dependencias y variables |

### Decisiones de diseño

Se mantiene una arquitectura monolítica ligera en Streamlit para ejecución local y se añade una arquitectura serverless para publicación. Vercel sirve la interfaz estática y ejecuta endpoints especializados que conservan la clave estándar fuera del JavaScript. La separación entre chat, Studio, visión, imágenes, publicidad, voz sintética, transcripción, moderación, Realtime y n8n facilita pruebas, límites por modalidad y evolución independiente. En voz, el endpoint crea la sesión y el navegador transporta audio por WebRTC, lo que reduce latencia. En Publicidad, OpenAI redacta únicamente el microguion y el navegador compone la fotografía, los textos, la música y el archivo final. n8n permanece desacoplado mediante HTTP, por lo que el workflow puede cambiar sin modificar los módulos de IA.

El historial se limita a los últimos mensajes para reducir el contexto. La clave puede escribirse temporalmente o cargarse desde el entorno. La primera opción facilita la exposición y la segunda es adecuada para un despliegue controlado.

## Tecnologías y organización

| Tecnología | Responsabilidad |
|---|---|
| Python | Lógica, validación y comunicación con APIs |
| Streamlit | Interfaz, chat, audio y estado |
| HTML CSS JavaScript | Interfaz web minimalista y controles del navegador |
| Canvas Web Audio MediaRecorder | Animación, música y exportación local de Publicidad |
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
| assets/nexora-logo.svg y assets/nexora-icon.png | Identidad visual vectorial y versión para Streamlit y Word |
| public/logo.svg y public/favicon.svg | Marca monocromática optimizada para la interfaz web |
| automations | Cinco workflows importables para acciones, estudio, reuniones, privacidad y métricas |
| n8n-local | Destino local de la bitácora JSONL; sus eventos se excluyen de Git |
| docs/images | Cuatro láminas técnicas originales en SVG y PNG para el informe |
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

El navegador obtiene el micrófono con `getUserMedia`, crea un `RTCPeerConnection` y genera una oferta SDP. Envía directamente `offer.sdp`, siguiendo el ejemplo oficial y evitando depender en Safari de una `localDescription` transitoria mientras se reúnen candidatos ICE. Para impedir el tratamiento incompleto de `application/sdp` en el runtime serverless, transporta esa oferta dentro de un objeto JSON al endpoint `/api/realtime-session`. La función extrae el SDP sin aplicar `trim()` ni alterar los finales de línea `CRLF` requeridos por el protocolo, valida que comience con `v=0`, limita la oferta a 128 KB y la combina con la configuración de sesión en el formulario multipart requerido por `/v1/realtime/calls`, sin exponer la API Key. La respuesta SDP completa la conexión. El audio se transporta por WebRTC y un canal de datos recibe eventos de turnos y transcripción. La sesión utiliza `gpt-realtime-2.1`, la voz `marin`, detección de turnos del servidor e instrucciones en español.

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

### Publicidad audiovisual

La vista Publicidad acepta cámara o archivo y conserva la fotografía en un objeto local del navegador. `/api/publicidad` valida tono, duración y un enfoque de hasta 600 caracteres; después solicita a Responses API un JSON con `headline`, `supporting` y `cta`. La función no recibe la fotografía. Si la solicitud falla, la interfaz utiliza un guion base que evita interrumpir la demostración.

El compositor dibuja treinta cuadros por segundo en un Canvas de 720 por 1280 o 1280 por 720 píxeles. Aplica recorte proporcional, acercamiento gradual, degradado de legibilidad, marca UTP, tres fases textuales y una barra de progreso. Web Audio programa acordes y pulsos originales según el tono. `captureStream` combina los cuadros con un destino de audio y MediaRecorder selecciona MP4 con H.264 y AAC en Safari cuando está disponible o WebM con VP9 u Opus en navegadores compatibles. La composición ocurre en tiempo real y libera cámaras, pistas, contextos de audio y URL temporales al finalizar.

La documentación oficial de OpenAI consultada el 11 de octubre de 2026 indica que Sora 2 y Videos API se retiraron el 24 de septiembre de 2026 y no tienen reemplazo directo. Por esa razón, el proyecto no llama a `/v1/videos`: utiliza OpenAI sólo para el microguion y produce el video en el dispositivo.

### Texto a voz

`/api/speech` envía hasta 2500 caracteres a `gpt-4o-mini-tts` con la voz `marin` y devuelve MP3 sin almacenarlo. La interfaz informa que el audio es generado por IA, reproduce el archivo y lo libera al cerrar la pestaña.

### Moderación

`/api/moderate` usa `omni-moderation-latest`. La respuesta pública se reduce a un indicador y las categorías positivas; no se muestran puntuaciones que puedan interpretarse como certezas. El resultado apoya una revisión humana y no sustituye una política institucional.

### Catálogo de endpoints serverless

| Ruta | Función | API externa |
|---|---|---|
| `/api/chat` | Conversación contextual | Responses |
| `/api/studio` | Once transformaciones textuales | Responses |
| `/api/publicidad` | Microguion publicitario UTP | Responses |
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

![Mapa de los cinco workflows locales de n8n](docs/images/mapa-workflows-n8n.png)

La instancia local contiene cinco workflows independientes. El primero atiende la interfaz de la aplicación; los otros cuatro amplían la demostración con capacidades especializadas y pueden invocarse directamente por HTTP.

![Captura real del listado de los cinco workflows publicados en n8n](docs/screenshots/nexora-listado-publicado.png)

La captura anterior corresponde a la instancia ejecutada en la Mac mediante Docker. En la columna derecha de cada fila se observa el estado **Published**, que habilita las URL de producción. El panel superior confirma además que la ejecución registrada terminó sin fallos. Las capturas de este capítulo se obtuvieron desde Safari sobre `http://localhost:5678`; no son maquetas ni diagramas conceptuales.

| Workflow | Método y ruta | Entrada principal | Resultado |
|---|---|---|---|
| Automatizaciones locales inteligentes | `POST /webhook/nexora` | Acción, asunto, destinatario y contenido | Email SMTP local, CSV, outbox, checklist, estudio o ICS |
| Coach de estudio adaptativo | `POST /webhook/nexora-study-coach` | Tema, contenido y minutos | Bloques, conceptos, preguntas y repaso espaciado |
| Laboratorio de reuniones | `POST /webhook/nexora-meeting-lab` | Título, participantes y transcripción | Acta, decisiones, tareas, responsables y riesgos |
| Guardián de privacidad | `POST /webhook/nexora-privacy-guardian` | Contenido por revisar | Hallazgos, puntaje y copia redactada |
| Panel de impacto local | `GET /webhook/nexora-impact-dashboard` | Sin cuerpo | Totales, indicadores, logros y actividad reciente |

### Workflow 1: centro de automatizaciones

![Captura real del workflow Centro de automatizaciones](docs/screenshots/nexora-workflow-centro-local.png)

Este flujo es la puerta de entrada de la aplicación. Después de construir el artefacto local, un nodo condicional separa la acción `email`: esa rama llama al puente SMTP, entrega el mensaje a Mailpit y confirma la recepción. Las demás acciones responden directamente con la ruta del archivo creado.

| Nodo | Configuración principal | Qué hace |
|---|---|---|
| Entrada NEXORA | Webhook `POST`, ruta `nexora`, respuesta mediante un nodo dedicado | Recibe la acción, destinatario, asunto, contenido, origen y fecha |
| Validar, priorizar y enriquecer | Nodo Code; acciones admitidas: `sheet`, `email`, `whatsapp`, `task`, `study` y `calendar` | Normaliza campos, limita el contenido, rechaza entradas incompletas y calcula prioridad |
| Guardar bitácora local | Nodo Code con acceso restringido a `/files`; archivo `nexora-events.jsonl` | Añade una línea JSON por solicitud sin guardar la OpenAI API Key |
| Construir artefacto local | Nodo Code con una rama lógica por acción | Crea CSV, outbox JSONL, checklist Markdown, plan de estudio o calendario ICS |
| ¿Es un correo? | Nodo If, condición `action = email` | Envía únicamente los correos hacia la rama SMTP |
| Enviar correo local | HTTP Request a `http://mailer:3001/send` | Entrega el mensaje al servicio SMTP privado de Docker |
| Confirmar correo local | Nodo Code | Añade el identificador del mensaje y la URL de Mailpit |
| Responder a NEXORA | Respond to Webhook, salida JSON | Devuelve identificador, prioridad, aprobación requerida y resultado final |

![Captura real de la configuración del nodo Webhook de entrada](docs/screenshots/nexora-configuracion-webhook.png)

La captura muestra la configuración exacta del nodo **Entrada NEXORA**. Para pruebas manuales se usa `http://localhost:5678/webhook-test/nexora` mientras el nodo está escuchando; cuando el workflow está publicado se utiliza `http://localhost:5678/webhook/nexora`. El método es `POST`, la autenticación está desactivada porque el servicio solo se expone en `localhost`, y la respuesta se delega al nodo **Responder a NEXORA** para controlar el JSON final. Si el servicio se publicara en Internet, sería obligatorio añadir autenticación, HTTPS y control de acceso.

```json
{
  "action": "task",
  "recipient": "equipo de exposición",
  "subject": "Preparar la sustentación",
  "content": "Urgente: terminar diapositivas hoy. Ensayar la demostración.",
  "source": "NEXORA AI",
  "timestamp": "2026-09-23T20:30:00"
}
```

### Workflow 2: coach de estudio adaptativo

![Captura real del workflow Coach de estudio adaptativo](docs/screenshots/nexora-workflow-coach-estudio.png)

Divide una duración entre 20 y 120 minutos en tres fases: comprender, recordar y comprobar. Extrae conceptos frecuentes, transforma oraciones del material en preguntas de recuperación y programa repasos para hoy, mañana, tres días y siete días.

| Nodo | Configuración principal | Qué hace |
|---|---|---|
| Recibir material de estudio | Webhook `POST`, ruta `nexora-study-coach` | Recibe tema, material y duración deseada |
| Diseñar sesión adaptativa | Nodo Code; duración acotada de 20 a 120 minutos | Calcula bloques, conceptos, preguntas y repaso espaciado |
| Guardar plan de estudio | Nodo Code; archivo `/files/nexora-study.jsonl` | Persiste el plan para medir uso e impacto |
| Entregar coach de estudio | Respond to Webhook, salida JSON | Devuelve el plan estructurado a la interfaz o cliente HTTP |

### Workflow 3: laboratorio de reuniones

![Captura real del workflow Laboratorio de reuniones](docs/screenshots/nexora-workflow-reuniones.png)

Recibe una transcripción y detecta expresiones de acuerdo, decisión, responsabilidad, tarea, bloqueo y riesgo.

| Nodo | Configuración principal | Qué hace |
|---|---|---|
| Recibir transcripción | Webhook `POST`, ruta `nexora-meeting-lab` | Recibe título, participantes y transcripción |
| Extraer acuerdos y responsables | Nodo Code con reglas de detección textual | Produce resumen, decisiones, responsables, pendientes y riesgos |
| Archivar acta inteligente | Nodo Code; archivo `/files/nexora-meetings.jsonl` | Conserva el acta estructurada para consulta local |
| Entregar acta y seguimiento | Respond to Webhook, salida JSON | Devuelve el acta y una recomendación de seguimiento |

### Workflow 4: guardián de privacidad

![Captura real del workflow Guardián de privacidad](docs/screenshots/nexora-workflow-privacidad.png)

Busca patrones comunes de correo, teléfono peruano, OpenAI API Key, número financiero y DNI indicado explícitamente.

| Nodo | Configuración principal | Qué hace |
|---|---|---|
| Recibir contenido sensible | Webhook `POST`, ruta `nexora-privacy-guardian` | Recibe el texto que se desea revisar |
| Detectar y redactar datos | Nodo Code con expresiones regulares y puntaje | Sustituye hallazgos por marcadores como `[EMAIL OCULTO]` |
| Guardar solo metadatos seguros | Nodo Code; archivo `/files/nexora-privacy-audit.jsonl` | Registra tipos y cantidad de hallazgos, sin conservar texto original ni redactado |
| Entregar versión redactada | Respond to Webhook, salida JSON | Devuelve copia segura, nivel de riesgo y recomendaciones |

### Workflow 5: panel de impacto local

![Captura real del workflow Panel de impacto local](docs/screenshots/nexora-workflow-panel-impacto.png)

Lee las cuatro bitácoras locales, tolera archivos todavía inexistentes y calcula el total de ejecuciones, prioridades altas, aprobaciones pendientes, alertas de privacidad y actividad reciente.

| Nodo | Configuración principal | Qué hace |
|---|---|---|
| Solicitar métricas | Webhook `GET`, ruta `nexora-impact-dashboard` | Permite consultar el panel sin enviar un cuerpo |
| Calcular impacto y actividad | Nodo Code con lectura tolerante de cuatro JSONL | Consolida totales, prioridades, aprobaciones, alertas y eventos recientes |
| Mostrar panel ejecutivo | Respond to Webhook, salida JSON | Entrega indicadores listos para una interfaz o para la exposición |

### Configuración común de la instancia local

| Elemento | Configuración | Motivo |
|---|---|---|
| Ejecución | `docker compose up -d` | Levanta n8n en segundo plano sin contratar n8n Cloud |
| Puerto | `5678:5678` | Expone el editor y los webhooks solo desde la Mac |
| Buzón Mailpit | `8025:8025` | Muestra los correos recibidos sin enviarlos a Internet |
| SMTP Mailpit | `1025:1025` | Recibe el correo de demostración dentro de Docker |
| Puente de correo | Servicio `mailer`, puerto interno `3001` | Valida la solicitud y conversa con Mailpit mediante SMTP |
| Persistencia n8n | Volumen `n8n_data` | Conserva workflows y configuración al reiniciar el contenedor |
| Persistencia del proyecto | `./n8n-local:/files` | Deja las bitácoras JSONL accesibles desde el repositorio local |
| Acceso a módulos | `NODE_FUNCTION_ALLOW_BUILTIN=fs,path` | Permite que los nodos Code escriban y consulten los archivos autorizados |
| Restricción de archivos | `N8N_RESTRICT_FILE_ACCESS_TO=/files` | Impide que los workflows lean rutas arbitrarias del contenedor |
| Zona horaria | `America/Lima` | Mantiene fechas y métricas coherentes con la demostración |

Cada workflow fue importado desde su JSON versionado en `automations/`, publicado mediante la CLI de n8n y probado por su URL de producción. Esta combinación hace reproducible la configuración: otro integrante puede levantar Docker, importar los mismos archivos y obtener los mismos nodos y rutas.

### Funcionamiento local e integraciones opcionales

El workflow funciona de principio a fin sin suscripciones. La acción `email` entrega un mensaje real por SMTP al buzón Mailpit local, accesible en `http://localhost:8025`; no se conecta con proveedores externos ni requiere credenciales. `sheet` crea `registro-nexora.csv`; `whatsapp` agrega un mensaje a `whatsapp-outbox.jsonl`; `task` y `study` escriben archivos Markdown; y `calendar` produce una invitación ICS. Todos los archivos se guardan en `n8n-local/outputs/`.

- **Google Sheets:** conectar Append Row únicamente si el equipo desea sincronizar la bitácora.
- **Correo externo:** sustituir el puente local por Gmail, Outlook o SMTP únicamente después de incorporar credenciales seguras y aprobación humana.
- **WhatsApp:** disponer de WhatsApp Business Cloud o Twilio, validar el número y cumplir las reglas de consentimiento.
- **Calendario:** conectar Google Calendar u Outlook Calendar después de que el usuario confirme fecha y contenido.

## Seguridad y privacidad

![Controles de seguridad y aprobación humana](docs/images/seguridad-datos.png)

### Activos protegidos

- OpenAI API Key y credenciales externas.
- Audios, transcripciones y resúmenes.
- Imágenes cargadas, prompts, resultados generados y narraciones.
- Fotografías de Publicidad, guiones y videos exportados.
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
- Workflow local operativo, con efectos limitados al buzón Mailpit y a `n8n-local/outputs/`.
- Correo local aislado de Internet, sin credenciales ni entrega a terceros.
- La fotografía y el video de Publicidad permanecen en memoria local del navegador; el servidor recibe sólo el enfoque textual.
- Permiso de cámara solicitado únicamente después de pulsar Abrir cámara y pistas detenidas al cerrar la vista o la pestaña.
- Guion de respaldo que mantiene la exportación local si OpenAI no responde.

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
| Foto publicitaria sensible | Media | Alto | Procesamiento local, aviso visible y no transmisión de la imagen |
| Navegador sin exportación multimedia | Baja | Medio | Detección de MediaRecorder y mensaje de compatibilidad |
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

### n8n local en macOS

1. Abrir Docker Desktop y esperar a que indique **Engine running**.
2. Desde la raíz del repositorio ejecutar `docker compose up -d`.
3. Comprobar `http://localhost:5678/healthz`; debe responder `{"status":"ok"}`.
4. Importar y publicar los cinco workflows incluidos si todavía no aparecen en el editor.

```bash
docker compose cp automations/nexora-n8n.json n8n:/tmp/nexora-n8n.json
docker compose cp automations/nexora-coach-estudio.json n8n:/tmp/nexora-coach-estudio.json
docker compose cp automations/nexora-laboratorio-reuniones.json n8n:/tmp/nexora-laboratorio-reuniones.json
docker compose cp automations/nexora-guardian-privacidad.json n8n:/tmp/nexora-guardian-privacidad.json
docker compose cp automations/nexora-panel-impacto.json n8n:/tmp/nexora-panel-impacto.json
docker compose exec -T n8n n8n import:workflow --input=/tmp/nexora-n8n.json
docker compose exec -T n8n n8n import:workflow --input=/tmp/nexora-coach-estudio.json
docker compose exec -T n8n n8n import:workflow --input=/tmp/nexora-laboratorio-reuniones.json
docker compose exec -T n8n n8n import:workflow --input=/tmp/nexora-guardian-privacidad.json
docker compose exec -T n8n n8n import:workflow --input=/tmp/nexora-panel-impacto.json
docker compose exec -T n8n n8n publish:workflow --id=nexoraLocalV2
docker compose exec -T n8n n8n publish:workflow --id=nexoraStudyCoachV1
docker compose exec -T n8n n8n publish:workflow --id=nexoraMeetingLabV1
docker compose exec -T n8n n8n publish:workflow --id=nexoraPrivacyGuardianV1
docker compose exec -T n8n n8n publish:workflow --id=nexoraImpactDashboardV1
docker compose restart n8n
```

n8n queda disponible en `http://localhost:5678`, su configuración persiste en el volumen `n8n_data` y las bitácoras aparecen dentro de `n8n-local/`. Para detenerlo sin perder datos se utiliza `docker compose stop`; para reanudar, `docker compose start`.

### Despliegue en Vercel

1. Importar `itslevanx/NexoraAI` en Vercel.
2. Seleccionar Other como preset y mantener el directorio raíz.
3. Configurar `OPENAI_API_KEY` y, opcionalmente, una URL pública HTTPS de n8n en `N8N_WEBHOOK_URL`.
4. Desplegar y abrir `https://nexora-ai-blue-three.vercel.app/`.
5. Autorizar el micrófono para Voz y la cámara para Publicidad cuando se utilicen esas funciones.
6. Comprobar Voz, Chat, Studio IA, Publicidad, Transcribir y Automatizar.

La versión serverless limita los audios y las imágenes enviados a OpenAI a menos de 4 MB. Publicidad admite fotos de hasta 10 MB porque nunca las transmite al servidor. Streamlit mantiene el límite local de audio de 25 MB.

`localhost` solo es accesible desde la Mac: el despliegue de Vercel no puede llamar directamente al contenedor local. Para demostrar n8n sin publicar servicios se utiliza la interfaz Streamlit local. Una futura conexión Vercel-n8n requeriría un dominio HTTPS protegido o un túnel temporal administrado por el equipo.

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

### Crear publicidad UTP

1. Abrir Publicidad en la versión Vercel.
2. Seleccionar Abrir cámara y permitir acceso o usar Subir foto con una imagen JPG, PNG o WEBP de hasta 10 MB.
3. Escribir un enfoque opcional y elegir 10, 15, 20 o 30 segundos, formato vertical u horizontal y estilo.
4. Pulsar Crear video promocional y mantener la pestaña visible durante la composición.
5. Reproducir el resultado para verificar movimiento, textos y música.
6. Descargar el archivo MP4 o WebM indicado por el navegador.

La fotografía y el video se procesan en el dispositivo. Sólo el enfoque textual se envía a OpenAI para redactar el microguion. La pieza es una demostración académica generada por NEXORA AI y no debe presentarse como material oficial de la universidad sin revisión y autorización institucional.

### Transcribir audio

1. Seleccionar Transcriptor.
2. Elegir Grabar ahora o Subir archivo.
3. Revisar el audio y pulsar Transcribir con IA.
4. Descargar el texto, crear un resumen o enviarlo al chat.

### Ejecutar automatizaciones

1. Ejecutar `./scripts/start_n8n_local.sh` y esperar el mensaje **NEXORA local está listo**.
2. Mantener `http://localhost:5678/webhook/nexora` en la barra lateral de Streamlit.
3. Abrir Automatizaciones y elegir CSV local, email local, WhatsApp local, tareas, estudio o calendario.
4. Escribir destinatario, asunto y contenido.
5. Revisar el payload y confirmar.
6. Verificar identificador, prioridad y resultado en la respuesta.
7. Si se eligió email, abrir `http://localhost:8025` y mostrar el correo recibido.
8. Para las demás acciones, revisar `n8n-local/outputs/` y la ejecución en n8n.

### Ejecutar los workflows avanzados

- Enviar material y duración a `/webhook/nexora-study-coach` para generar un plan de estudio.
- Enviar una transcripción a `/webhook/nexora-meeting-lab` para obtener un acta automática.
- Enviar texto a `/webhook/nexora-privacy-guardian` para recibir una versión redactada.
- Abrir `/webhook/nexora-impact-dashboard` con GET para mostrar las métricas consolidadas.

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
| CP 08 | Chat con clave | Respuesta visible | Aprobado en producción |
| CP 09 | Audio mayor a 25 MB | Error, sin solicitud | Preparado |
| CP 10 | Audio válido | Transcripción visible | Aprobado en producción |
| CP 11 | Webhook ausente | Solicita URL | Aprobado |
| CP 12 | Webhook local | Confirmación JSON, prioridad y checklist | Aprobado |
| CP 13 | Acción inválida | Error de validación | Aprobado |
| CP 14 | Clave fuera de Git | No existe secreto | Aprobado |
| CP 15 | Sintaxis JavaScript | Todos los archivos pasan `node --check` | Aprobado |
| CP 16 | Interfaz Safari | Diseño monocromático y navegación visibles | Aprobado |
| CP 17 | Voz WebRTC | Audio bidireccional | Aprobado en Safari |
| CP 18 | Paridad Vercel | Chat, grabación, resumen, descarga y n8n disponibles | Aprobado |
| CP 19 | Modos de Studio | Los once modos aparecen y envían un modo permitido | Aprobado |
| CP 20 | Imagen mayor de 4 MB | Se rechaza antes de la solicitud | Preparado |
| CP 21 | Visión válida | Análisis textual visible | Aprobado en producción |
| CP 22 | Generación visual | JPEG visible y descargable | Aprobado en producción |
| CP 23 | Narración | MP3 reproducible con aviso de voz IA | Aprobado en producción |
| CP 24 | Moderación | Resultado y categorías visibles | Aprobado en producción |
| CP 25 | Endpoints nuevos | Todos pasan `node --check` y existen en pruebas | Aprobado |
| CP 26 | Seis acciones n8n | Cada acción devuelve un resultado especializado | Aprobado |
| CP 27 | Persistencia local | Cada solicitud añade una línea JSONL | Aprobado |
| CP 28 | Coach de estudio | Plan de 60 minutos, preguntas y cuatro repasos | Aprobado |
| CP 29 | Laboratorio de reuniones | Detecta decisiones, tareas y riesgos | Aprobado |
| CP 30 | Guardián de privacidad | Oculta correo, teléfono y clave; no persiste el texto | Aprobado |
| CP 31 | Panel de impacto | Consolida cuatro bitácoras y actividad reciente | Aprobado |
| CP 32 | Email SMTP local | Mensaje visible en Mailpit con destinatario, asunto y cuerpo | Aprobado en Safari |
| CP 33 | Hoja CSV local | Fila persistida en `registro-nexora.csv` | Aprobado |
| CP 34 | Outbox WhatsApp | Mensaje persistido en JSONL sin envío externo | Aprobado |
| CP 35 | Archivos de productividad | Tareas Markdown, estudio Markdown y calendario ICS válidos | Aprobado |
| CP 36 | Carga de foto publicitaria | Vista previa local y botón de creación habilitado | Aprobado en Safari |
| CP 37 | Duraciones publicitarias | Opciones 10, 15, 20 y 30 segundos | Aprobado |
| CP 38 | Exportación audiovisual | Video de 15 segundos reproducible con pista de audio | Aprobado en Safari |
| CP 39 | Privacidad de Publicidad | La solicitud al servidor no contiene la fotografía | Aprobado por revisión de código |
| CP 40 | Guion de respaldo | La composición continúa si `/api/publicidad` no está disponible | Aprobado en Safari local |
| CP 41 | Pruebas del endpoint | Clave, longitud y extracción JSON se validan sin llamadas reales | Aprobado |

### Evidencia funcional de automatización local

El 26 de septiembre de 2026 se levantaron n8n 2.40.7, Mailpit y el puente SMTP mediante Docker Desktop. Se envió un correo desde `POST /webhook/nexora` a `docente@ejemplo.com`; n8n respondió **“Email entregado correctamente al buzón local”** y Mailpit mostró el remitente `noreply@nexora.local`, el asunto **“NEXORA AI - Prueba local”** y el cuerpo completo. La verificación se realizó en Safari sobre `http://localhost:8025`.

En la misma ronda se probaron las otras cinco acciones. Se creó una fila CSV, un mensaje en el outbox local de WhatsApp, un checklist Markdown, un plan de estudio Markdown y una invitación de calendario ICS. Los nueve tests JavaScript y los cuatro tests Python finalizaron correctamente. Ninguna de estas pruebas transmitió datos o correos fuera de la Mac.

El 11 de octubre de 2026 se probó Publicidad en Safari con una imagen sintética del proyecto. La interfaz cargó la imagen, utilizó el guion de respaldo al ejecutarse desde un servidor estático, compuso un video vertical con música, mostró progreso en tiempo real y produjo un archivo de 15 segundos. Los controles nativos de Safari informaron una duración de 15 segundos y una pista de audio activa. La evidencia se conserva en `docs/screenshots/nexora-publicidad-video.png`.

![Video publicitario de 15 segundos generado y reproducido en Safari](docs/screenshots/nexora-publicidad-video.png)

### Evidencia funcional en producción

El 25 de septiembre de 2026 se ejecutó una prueba manual de extremo a extremo en Safari sobre `https://nexora-ai-blue-three.vercel.app/`, utilizando la variable de entorno segura del despliegue. Se verificaron Chat, Studio de texto, narración, Visión, generación de imágenes, moderación, carga y transcripción de un WAV, resumen de la transcripción y conversación de voz mediante WebRTC. La voz alcanzó el estado **“Conversación activa”** y pudo finalizarse de forma controlada. Visión describió y extrajo correctamente el contenido del diagrama de arquitectura; Imágenes produjo una pieza monocromática descargable; Seguridad clasificó el texto académico como no marcado; y Transcribir devolvió texto y habilitó su resumen. La sección Automatizar se excluyó deliberadamente de esta ronda por indicación del solicitante.

La prueba de voz confirma que el endpoint conserva los finales de línea `CRLF` del SDP y que Safari acepta la respuesta de OpenAI sin mostrar **“La oferta WebRTC no es válida”**. La transcripción se probó con un audio sintético de 4,3 segundos sin información personal.

```bash
python -m pytest -q
python -m py_compile app.py
npm run check
git status --short
```

### Criterios de aceptación

- La aplicación inicia sin errores y ninguna clave real aparece en Git.
- Las seis áreas son accesibles.
- La versión Vercel conserva las funciones centrales y añade voz en tiempo real, Studio IA multimodal y Publicidad.
- Publicidad toma o carga una foto, ofrece 10 a 30 segundos y produce un video descargable con música sin transmitir la imagen.
- Chat y transcripción solicitan una clave cuando falta.
- n8n publica cinco workflows; el centro acepta seis acciones y los cuatro flujos avanzados entregan resultados especializados.
- Los errores de red se muestran de forma controlada.
- El equipo puede ejecutar el guion completo.

## Riesgos operativos

| Riesgo | Consecuencia | Respuesta |
|---|---|---|
| Falta de saldo | La demo no responde | Verificar cuenta antes de exponer |
| Modelo no disponible | Error en chat | Cambiar modelo en la barra lateral |
| Micrófono bloqueado | No se graba | Usar audio preparado |
| Cámara bloqueada | No se toma la foto | Subir una imagen preparada |
| Exportación no compatible | No se crea el archivo | Usar Safari Chrome o Edge recientes y revisar MediaRecorder |
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
- Publicidad con foto cargada, video reproducible, música y descarga.
- Workflow completo y ejecución exitosa en n8n.
- Resultado de pytest.
- Historial de commits atómicos.
- URL del repositorio.

## Limitaciones y mejoras futuras

La aplicación no persiste conversaciones ni archivos multimedia. n8n conserva bitácoras y artefactos de demostración dentro de `n8n-local/`; Mailpit conserva temporalmente los correos locales mientras sus contenedores estén disponibles. Estos mensajes no llegan a Gmail, Outlook ni a un destinatario real. La precisión depende del modelo, el audio, la imagen y las instrucciones. El proyecto no verifica hechos de manera independiente y el consumo puede generar costos. La conversación de voz necesita HTTPS, permiso de micrófono y acceso al modelo Realtime. La versión Vercel limita cada audio o imagen enviado a OpenAI a menos de 4 MB y no puede acceder al `localhost` de la Mac. Publicidad admite fotos locales de hasta 10 MB, pero compone en tiempo real: una pieza de 30 segundos tarda aproximadamente 30 segundos y requiere mantener la pestaña activa. El contenedor final depende del soporte de MediaRecorder; Safari utiliza MP4 cuando lo admite y otros navegadores pueden usar WebM. Sora 2 y Videos API fueron retirados el 24 de septiembre de 2026, por lo que no existe un endpoint de OpenAI utilizado para producir el video. La narración acepta hasta 2500 caracteres por solicitud y la generación de imágenes puede requerir verificación de la organización de OpenAI. La moderación es una señal de apoyo y no una decisión definitiva.

Mejoras propuestas: usuarios y roles; persistencia con PostgreSQL o Supabase; búsqueda semántica y documentos PDF; edición iterativa de imágenes; respuestas en streaming; métricas de tokens y costos; firma HMAC para el webhook; aprobación de acciones; plantillas por curso; caché de resultados; y pruebas end to end.

## Conclusiones

NEXORA AI demuestra que se pueden integrar lenguaje, visión, generación de imágenes, publicidad audiovisual, voz sintética, conversación de voz, transcripción, moderación y automatización en una aplicación compacta. Streamlit mantiene una versión local fácil de explicar; Vercel publica la suite minimalista bajo HTTPS; OpenAI procesa distintas modalidades y redacta el microguion; el navegador compone el video publicitario sin transmitir la fotografía; y n8n representa las acciones externas.

El proyecto evidencia que una integración responsable requiere validar entradas, manejar errores, separar credenciales, limitar el alcance y documentar los pasos. El workflow local permite enseñar una ejecución real: envía un correo por SMTP a un buzón aislado y produce archivos comprobables sin contactar servicios externos.

La solución queda preparada para evolucionar. La persistencia, autenticación, monitoreo y aprobación permitirían convertir el prototipo en una herramienta de uso continuo.

## Recomendaciones

- Probar la demostración un día antes.
- Utilizar una clave exclusiva y rotarla después.
- Preparar un audio y video de respaldo.
- Explicar que los servicios externos son extensiones opcionales y que los borradores requieren aprobación.
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
| Canvas | Superficie gráfica del navegador utilizada para dibujar cada cuadro del video |
| MediaRecorder | API del navegador que codifica pistas de audio y video |
| Web Audio | API del navegador utilizada para sintetizar y mezclar la música |
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
OpenAI. Sora 2 Pro deprecation notice. https://developers.openai.com/api/docs/models/sora-2-pro
Universidad Tecnológica del Perú. Portal institucional. https://www.utp.edu.pe/
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
| Mensaje no enviado | El flujo genera un borrador seguro | Revisar, aprobar y conectar el proveedor externo si se necesita envío real |
| Voz no inicia | Micrófono bloqueado o modelo sin acceso | Autorizar Safari y verificar la cuenta |
| “La oferta WebRTC no es válida” o `Failed to parse offer … EOF` | El runtime interpretó o truncó el cuerpo `application/sdp` | Usar la versión actual, que transporta el SDP dentro de JSON y valida la oferta completa; desplegar de nuevo en Vercel |
| Vercel muestra 401 | Variable y clave temporal ausentes | Configurar `OPENAI_API_KEY` o pegarla en Configuración |
| Audio web rechazado | Archivo mayor de 4 MB | Reducir el archivo o usar Streamlit local |
| Imagen rechazada | Formato o tamaño no permitido | Usar PNG, JPG o WEBP de menos de 4 MB |
| Imagen no se genera | Acceso, saldo o verificación | Revisar la cuenta y el modelo disponible |
| Narración no reproduce | Autoplay o texto demasiado largo | Pulsar reproducción o reducir a 2500 caracteres |
| Moderación marca contenido | Categoría sensible detectada | Revisar manualmente y aplicar la política del equipo |
| Cámara de Publicidad no abre | Permiso denegado o dispositivo ausente | Autorizar Safari o usar Subir foto |
| Video no se exporta | MediaRecorder o captureStream no compatibles | Actualizar Safari Chrome o Edge y repetir con la pestaña visible |
| Video se descarga como WebM | El navegador no admite MP4 para MediaRecorder | Reproducir WebM o convertirlo después; el contenido no cambia |
| Guion IA no disponible | Falta de clave red o modelo | La interfaz utiliza automáticamente el guion base |

## Anexo C Lista de verificación

- [ ] Completar carátula e integrantes.
- [x] Insertar capturas reales de los cinco workflows, el listado publicado y la configuración del Webhook.
- [ ] Confirmar que no exista una API key.
- [ ] Ejecutar pruebas y registrar resultado.
- [ ] Verificar la URL del repositorio.
- [ ] Ensayar con cronómetro.
- [ ] Preparar audio y video de respaldo.
- [ ] Preparar una imagen de prueba sin datos personales.
- [x] Guardar captura real del video de Publicidad reproducible en Safari.
- [ ] Probar Publicidad en la URL de producción después de cada despliegue.
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
| Crear publicidad audiovisual | RF 36 a RF 42 | Vista Publicidad, microguion, Canvas, Web Audio y MediaRecorder |
| Proteger la fotografía | RF 43 y RNF 17 | Composición local y payload sin imagen |
| Proteger credenciales | RNF 02 y RNF 03 | Gitignore y separación de servicios |
| Documentar y probar | RNF 09 | README, informe, pytest y revisión visual |
