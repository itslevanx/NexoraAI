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

NEXORA AI es una aplicación web de apoyo académico y productividad construida con Python y Streamlit. Integra un chatbot basado en la Responses API de OpenAI, un módulo de transcripción mediante el modelo gpt-transcribe y un sistema de automatizaciones conectado a n8n por un webhook. El propósito es demostrar que una misma interfaz puede recibir consultas, transformar voz en texto, resumir información y entregar datos estructurados a flujos externos sin incrustar credenciales sensibles en el código.

La persona usuaria puede pegar temporalmente una OpenAI API Key, seleccionar un modelo disponible en su cuenta, conversar con el asistente, grabar o cargar un audio, generar un resumen y activar una automatización. El workflow incluido opera en modo demostración seguro: valida la solicitud, identifica la acción y devuelve una confirmación. La conexión real con Google Sheets, correo o WhatsApp requiere que el equipo configure sus credenciales dentro de n8n.

El prototipo cubre los objetivos de creación de chatbots, consumo de modelos de OpenAI, transcripción con IA, diseño de interfaces en Streamlit y automatización de procesos. También deja una base extensible para incorporar autenticación, almacenamiento persistente, analítica y despliegue.

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

Streamlit permite construir una interfaz web sin separar frontend y backend. El SDK oficial de OpenAI simplifica las solicitudes de generación de texto y transcripción. n8n aporta una representación visual de los procesos y separa las credenciales externas de la aplicación.

### Justificación práctica

La solución reduce pasos manuales en escenarios como tomar apuntes de voz, resumir una reunión, preparar un correo o registrar una actividad. Aunque el workflow se entrega en modo demostración, la arquitectura permite conectar servicios reales sin rediseñar la aplicación.

## Objetivos

### Objetivo general

Desarrollar una aplicación web de apoyo académico que integre conversación con inteligencia artificial, transcripción de audios y automatización de tareas mediante las API de OpenAI, Streamlit y n8n.

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

## Alcance

### Funciones incluidas

- Interfaz web ejecutada localmente.
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

## Casos de uso

### Conversar con NEXORA

**Actor:** usuario. **Precondición:** API key válida y modelo disponible.

1. El usuario abre Chat inteligente y escribe una consulta.
2. La aplicación agrega el mensaje al historial.
3. Streamlit envía instrucciones y contexto a OpenAI.
4. La respuesta aparece dentro del chat.
5. La respuesta se conserva para la siguiente interacción.

Si falta la clave, la app solicita configurarla. Si OpenAI devuelve un error, se muestra sin cerrar la sesión.

### Transcribir una nota de voz

1. El usuario abre Transcriptor.
2. Graba audio o selecciona un archivo.
3. La app valida el tamaño.
4. El usuario confirma la transcripción.
5. El audio se envía al endpoint de transcripciones.
6. El texto se muestra y puede descargarse.

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
4. Streamlit envía una solicitud POST.
5. n8n valida y enruta la acción.
6. n8n devuelve una confirmación.

## Arquitectura de la solución

```text
Usuario
  │ navegador
  ▼
NEXORA AI con Streamlit
  ├── Interfaz y estado de sesión
  ├── Cliente de OpenAI
  ├── Validación de audio
  └── Cliente HTTP para n8n
       ├── OpenAI Responses API
       ├── OpenAI Transcriptions API
       └── Webhook n8n
              ├── Validación
              ├── Enrutamiento
              └── Sheets Email WhatsApp
```

### Componentes

| Componente | Responsabilidad |
|---|---|
| Interfaz Streamlit | Renderizar vistas, recibir datos y mantener la sesión |
| Módulo de chat | Preparar contexto y consumir Responses API |
| Módulo de audio | Validar y consumir Transcriptions API |
| Módulo de resumen | Estructurar el contenido transcrito |
| Módulo de automatización | Construir payload y ejecutar POST |
| Workflow n8n | Validar, normalizar, enrutar y responder |
| Configuración | Definir tema, dependencias y variables |

### Decisiones de diseño

Se eligió una arquitectura monolítica ligera para una demostración rápida y comprensible. Streamlit combina servidor y presentación, reduce archivos y elimina la necesidad de desarrollar una API propia y un frontend separado. n8n se mantiene desacoplado mediante HTTP, por lo que el workflow puede cambiar sin modificar los módulos de IA.

El historial se limita a los últimos mensajes para reducir el contexto. La clave puede escribirse temporalmente o cargarse desde el entorno. La primera opción facilita la exposición y la segunda es adecuada para un despliegue controlado.

## Tecnologías y organización

| Tecnología | Responsabilidad |
|---|---|
| Python | Lógica, validación y comunicación con APIs |
| Streamlit | Interfaz, chat, audio y estado |
| OpenAI SDK | Cliente de Responses y Transcriptions |
| n8n | Workflow y conectores externos |
| Requests | Solicitud POST al webhook |
| Docker Compose | Instancia local de n8n |
| Pytest | Pruebas automáticas de humo |

| Ruta | Contenido |
|---|---|
| app.py | Página, tema, estado, API, vistas y navegación |
| assets/nexora-icon.png | Identidad visual |
| automations/nexora-n8n.json | Workflow importable |
| .streamlit/config.toml | Tema y límite de carga |
| .env.example | Variables sin secretos reales |
| requirements.txt | Dependencias Python |
| docker-compose.yml | Servicio n8n |
| run.sh y run.bat | Instalación y arranque |
| tests/test_smoke.py | Pruebas básicas |

## Funcionamiento interno

### Inicialización y estado

Streamlit configura el título, icono y diseño ancho. `inject_theme` incorpora estilos y animaciones. `init_state` crea el historial inicial, transcripción, estado de API y contador de solicitudes.

### Credenciales

`get_client` prioriza la clave escrita en la interfaz y utiliza `OPENAI_API_KEY` como alternativa. Si no hay clave, devuelve un valor nulo y la vista muestra una advertencia. La clave nunca se agrega al historial ni al payload de n8n.

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
- URL de webhooks productivos.

### Controles implementados

- `.env` y secretos excluidos mediante `.gitignore`.
- Campo de API key oculto.
- Separación entre credenciales de OpenAI y n8n.
- Validación de tamaño y formatos.
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

```bash
python -m pytest -q
python -m py_compile app.py
git status --short
```

### Criterios de aceptación

- La aplicación inicia sin errores y ninguna clave real aparece en Git.
- Las cinco áreas son accesibles.
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

## Estrategia de demostración

**Minuto 1:** problema y arquitectura.  
**Minuto 2:** consulta académica.  
**Minuto 3:** grabación y transcripción.  
**Minuto 4:** resumen y webhook.  
**Minuto 5:** ejecución en n8n, seguridad y mejoras.

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

- Pantalla principal, chat, transcripción y resumen.
- Workflow completo y ejecución exitosa en n8n.
- Resultado de pytest.
- Historial de commits atómicos.
- URL del repositorio.

## Limitaciones y mejoras futuras

La aplicación no persiste conversaciones ni archivos. El modo demostración de n8n no crea efectos externos. La precisión depende del modelo, el audio y las instrucciones. El proyecto no verifica hechos de manera independiente y el consumo puede generar costos.

Mejoras propuestas: usuarios y roles; persistencia con PostgreSQL o Supabase; búsqueda semántica; respuestas en streaming; métricas de tokens y costos; firma HMAC para el webhook; aprobación de acciones; plantillas por curso; despliegue HTTPS; y pruebas end to end.

## Conclusiones

NEXORA AI demuestra que se pueden integrar modelos de lenguaje, transcripción y automatización en una aplicación compacta. Cada componente es visible y explicable: Streamlit gestiona la experiencia, OpenAI procesa texto y audio, y n8n representa las acciones externas.

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
| Transcripción | Conversión de voz en texto |
| Webhook | URL que recibe eventos mediante HTTP |
| Workflow | Secuencia automatizada de tareas |

## Bibliografía

OpenAI. Developer quickstart. https://developers.openai.com/api/docs/quickstart  
OpenAI. File transcription. https://developers.openai.com/api/docs/guides/speech-to-text  
Streamlit. Documentation. https://docs.streamlit.io/  
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

## Anexo C Lista de verificación

- [ ] Completar carátula e integrantes.
- [ ] Insertar capturas reales.
- [ ] Confirmar que no exista una API key.
- [ ] Ejecutar pruebas y registrar resultado.
- [ ] Verificar la URL del repositorio.
- [ ] Ensayar con cronómetro.
- [ ] Preparar audio y video de respaldo.
- [ ] Revisar ortografía y formato institucional.
- [ ] Entregar el Word o PDF solicitado.

## Anexo D Trazabilidad

| Objetivo | Requisito | Evidencia |
|---|---|---|
| Implementar chatbot | RF 01 a RF 05 | Vista Chat y función chat |
| Transcribir audio | RF 06 a RF 10 | Vista Transcriptor y función transcribe |
| Generar apuntes | RF 11 y RF 12 | Botones de resumen y chat |
| Automatizar | RF 13 a RF 17 | Workflow y vista Automatizaciones |
| Proteger credenciales | RNF 02 y RNF 03 | Gitignore y separación de servicios |
| Documentar y probar | RNF 09 | README, informe, pytest y revisión visual |
