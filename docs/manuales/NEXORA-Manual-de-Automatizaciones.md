# Manual de usuario de Automatizaciones

NEXORA AI · Instalación local en Mac · Rama TA4 · Noviembre de 2026

Esta guía explica qué abrir y cómo poner en marcha las seis automatizaciones. Puedes trabajar desde NEXORA y, si conectas Telegram, consultar y actualizar los mismos datos desde el bot.

## Inicio rápido en esta Mac

La instalación y el bot ya se configuraron. En los siguientes encendidos sigue estos pasos. Si el proyecto no aparece en Docker, utiliza la preparación de la página 2.

1. Abre Docker Desktop desde Aplicaciones y espera a que indique que el motor está funcionando.
2. En Docker Desktop entra en Containers y busca el proyecto nexora-ta4. Despliégalo para ver web, n8n y automation.
3. Si está detenido, pulsa Start o el icono de reproducción del proyecto. Comprueba que los tres servicios estén en ejecución.
4. Abre Safari y escribe http://localhost:3000/#automate en la barra de direcciones. Espera a que carguen los pendientes.
5. Comprueba que aparezca «Almacenamiento local conectado». Si usarás el bot, el estado también debe indicar «Telegram activo».
6. Abre Telegram en tu teléfono o en la Mac, entra en @nexoraautomatizacionbot y envía /ayuda. Espera unos segundos a su respuesta.

## Qué debe permanecer abierto

Docker Desktop debe seguir funcionando y la Mac debe permanecer encendida y despierta. Puedes cerrar Terminal y las pestañas de Safari después del arranque. No necesitas dejar abierto el editor de n8n ni Telegram Web para recibir mensajes en tu teléfono.

Telegram necesita Internet en la Mac. Las tres automatizaciones de NEXORA pueden usarse sin conectar el bot. Si la Mac duerme o se apaga, los procesos se interrumpen.

## Dónde encontrar cada paso

2 Preparación y comprobación · 3 Tareas y reuniones · 4 Estudio y reportes · 5 Conexión de Telegram · 6 Comandos del bot · 7 Solución de problemas · 8 Cierre y respaldo


<!-- página siguiente -->

# Preparación y comprobación del arranque

Usa este procedimiento para preparar la instalación por primera vez o volver a cargar los seis flujos desde los archivos del proyecto. Para el uso diario ya configurado basta el inicio rápido de la página 1.

## Antes de comenzar

Necesitas Docker Desktop instalado y en ejecución, Node.js 24 y el proyecto en /Users/levanx/Documents/NexoraAI. La primera descarga requiere Internet y puede tardar varios minutos. No abras otra aplicación que utilice los puertos 3000 o 5678.

1. Abre Terminal desde Aplicaciones > Utilidades. Copia cada línea del siguiente bloque y pulsa Enter después de cada una.
2. Espera a que termine el proceso. No cierres Terminal mientras descarga o construye los servicios.
3. Al terminar deben aparecer las direcciones de Automatizaciones y n8n. Abre la primera en Safari.

```text
cd /Users/levanx/Documents/NexoraAI
./scripts/start_automations_local.sh
```

El script crea la configuración local si falta, inicia los servicios e importa y publica los seis flujos. Puedes repetirlo sin borrar tus tareas. También vuelve a importar las definiciones del proyecto: los cambios hechos únicamente en el editor de esos flujos deben guardarse antes en sus archivos fuente.

## Las dos direcciones

NEXORA para trabajar: http://localhost:3000/#automate
n8n para revisar los flujos: http://localhost:5678

Usa estas direcciones en la misma Mac. La web publicada en Internet no puede acceder a los servicios locales de esta instalación. Un teléfono no abre el NEXORA de la Mac usando su propio localhost; desde el teléfono utiliza Telegram.

## Comprobación de n8n

Pulsa «Abrir n8n local» en NEXORA. Si es el primer acceso y n8n pide crear el administrador, completa tú mismo los datos y conserva tu acceso. En Overview > Workflows deben aparecer seis flujos NEXORA TA4 con estado Published.

Los flujos son Agenda y vencimientos, Planificador de estudio, Reporte diario y semanal, Bot Gestor de tareas, Bot Asistente de estudio y Bot Seguimiento de reuniones. Las acciones habituales se disparan desde NEXORA, el bot o el horario automático; no necesitas pulsar Execute workflow cada vez.


<!-- página siguiente -->

# Tareas y acuerdos de reunión

Abre http://localhost:3000/#automate. Los formularios y las listas de esta página comparten los mismos registros que consulta el bot.

## Guardar una tarea

1. En «Agenda y entregas», escribe el nombre en «Tarea». Por ejemplo, Entregar informe.
2. Añade «Curso o proyecto» si lo necesitas. Elige una fecha y hora futura en «Fecha y hora · Lima».
3. Elige la prioridad Normal, Alta o Baja y pulsa «Guardar tarea».
4. Busca el registro en «Mis tareas y acuerdos». Comprueba su título y vencimiento.
5. Cuando termines el trabajo, pulsa «Completar» junto al registro. Dejará de aparecer entre los pendientes.

Resultado esperado: el mensaje «Listo. Los cambios están guardados localmente» y la tarea en la lista. Si hiciste el cambio desde Telegram, pulsa «Actualizar pendientes» para verlo en Safari.

## Guardar el compromiso de una reunión

1. En «Acuerdos de reunión», escribe el nombre de la reunión y, si quieres, las notas o el contexto.
2. En «Acuerdo», escribe la acción concreta, por ejemplo Revisar el prototipo. Introduce el responsable y la fecha de entrega.
3. Pulsa «Guardar reunión y acuerdo». El acuerdo aparecerá en «Mis tareas y acuerdos» con su responsable.
4. Al cumplirlo, pulsa «Completar» o utiliza /acuerdohecho con el identificador que entregue el bot.

El formulario registra un acuerdo por envío. Escribe el compromiso de forma explícita: esta versión no extrae acuerdos automáticamente de un texto libre ni envía mensajes a cada responsable. El bot utiliza el único chat privado autorizado.

## Fechas y avisos

Todos los horarios se interpretan en hora de Lima. n8n revisa los pendientes cada minuto mientras los servicios están activos. Con Telegram conectado, el chat autorizado puede recibir los avisos correspondientes. Consulta «Historial y estado» para revisar actividad o errores.

Para comprobar la conexión sin crear registros, pulsa «Actualizar pendientes». Si pruebas creando una tarea, utiliza un título como PRUEBA y complétala al terminar.


<!-- página siguiente -->

# Estudio y reportes de actividad

## Crear un plan de estudio

1. En «Plan de estudio», escribe el tema o examen que prepararás.
2. Elige una fecha y hora futura en «Fecha y hora del examen · Lima».
3. Indica la duración en «Minutos por sesión», entre 20 y 120. El valor inicial es 40.
4. Elige la «Hora diaria · Lima» y pulsa «Crear plan y repasos».
5. Revisa «Sesiones de estudio». Verás las próximas 30 sesiones pendientes con tema, fase, fecha y duración.

El plan organiza sesiones antes del examen y alterna estudio, repaso y autoevaluación. Omite horarios ocupados. Elige un examen y una disponibilidad que dejen tiempo suficiente para las sesiones.

## Completar o cambiar una sesión

1. Cuando termines una sesión, pulsa «Completada» en su fila. La sesión saldrá de la lista de pendientes.
2. Para moverla, elige una nueva fecha y hora en el campo de esa misma fila y pulsa «Reprogramar».
3. Comprueba la fecha actualizada. El horario debe estar en el futuro, terminar antes del examen y no cruzarse con otra sesión.

También puedes consultar /estudio en Telegram y usar /estudiado o /reprogramar con el identificador de la sesión. Pulsa «Actualizar pendientes» en NEXORA para recoger esos cambios.

## Consultar el avance

1. Pulsa «Reporte diario» para consultar las últimas 24 horas o «Reporte semanal» para consultar los últimos 7 días.
2. En «Reportes», revisa las tareas pendientes, las vencidas y las cantidades de tareas y sesiones completadas.
3. Después de completar una tarea o sesión, vuelve a generar el reporte para ver el avance actualizado.

La agenda diaria automática se prepara desde las 08:00 y el reporte semanal los domingos desde las 18:00, hora de Lima. Requieren que la Mac y los servicios sigan activos. La revisión por minuto puede introducir una pequeña espera.

Al volver de una interrupción se recupera el reporte del día. No se reconstruyen todos los reportes de días completos en los que la instalación estuvo apagada. La consulta semanal manual está disponible sin esperar al domingo.


<!-- página siguiente -->

# Conectar Telegram una sola vez

Si NEXORA ya indica «Telegram activo» y /ayuda responde, omite esta configuración. El token y el chat quedan guardados en la instalación local y sobreviven al reinicio.

## Crear o elegir el bot

1. Abre Telegram y busca el usuario oficial @BotFather. Para un bot nuevo, envíale /newbot y sigue sus instrucciones de nombre y nombre de usuario.
2. Conserva el token que entrega BotFather. Es la clave del bot. No lo publiques ni lo incluyas en capturas.
3. Abre un chat privado con tu propio bot, no con BotFather. En esta instalación es @nexoraautomatizacionbot. Pulsa Iniciar o escribe /start en el campo de mensajes y envíalo.

## Autorizar tu chat en NEXORA

1. Con los servicios iniciados, abre NEXORA local y despliega «Conectar el bot de Telegram».
2. Pega la clave en «Token de BotFather» y pulsa «Buscar mi chat».
3. Debajo aparecerá «Chat» seguido de un número. Pulsa «Usar este chat» para copiarlo a «Identificador numérico del chat».
4. Pulsa «Conectar Telegram». Comprueba que el estado indique «Telegram activo».
5. Vuelve al chat privado de tu bot y envía /ayuda. A partir de ese momento usa allí todos los comandos de la página siguiente.

El identificador es el número del chat encontrado por NEXORA. No es el nombre del bot, tu @usuario ni el token. No necesitas buscarlo en la conversación con BotFather.

## Si no aparece el chat

Comprueba que enviaste /start a tu bot. Envíale otro mensaje y vuelve a pulsar «Buscar mi chat». Si Telegram sigue sin responder, revisa la conexión de Internet de la Mac y el error en «Historial y estado».

La conexión local funciona sin n8n Cloud ni un túnel público. La Mac consulta los mensajes de Telegram. Usa un bot dedicado: otro programa con ese mismo token o un webhook ya configurado puede impedir la recepción.

«Pausar Telegram» detiene la recepción y el envío del bot. Los registros se conservan. Para volver a activarlo, usa el chat guardado y pulsa «Conectar Telegram»; si conservas el token, no hace falta volver a pegarlo.


<!-- página siguiente -->

# Comandos del bot

Escribe estos comandos en el chat privado de tu bot y envíalos como mensajes. Las consultas no necesitan datos adicionales. /ayuda muestra la sintaxis y los botones de consulta.

| Comando | Qué hace |
|---|---|
| /ayuda | Muestra las opciones y cómo escribirlas. |
| /hoy | Consulta tareas de hoy y las vencidas. |
| /pendientes | Consulta las tareas y sus identificadores. |
| /estudio | Consulta las sesiones y sus identificadores. |
| /reuniones | Consulta los acuerdos pendientes. |

## Registrar desde Telegram

```text
/agregar Entregar informe | 2026-11-10T18:00 | Programación
```

Orden de los datos: tarea, fecha y hora, curso o proyecto.

```text
/acuerdo Avance semanal | Ana | 2026-11-10T18:00 | Revisar prototipo
```

Orden de los datos: reunión, responsable, fecha y hora, acuerdo. Separa cada dato con el carácter |. Sustituye las fechas de ejemplo por fechas futuras.

## Completar y reprogramar

```text
/hecho ID_DE_TAREA
/estudiado ID_DE_SESION
/reprogramar ID_DE_SESION | 2026-11-09T19:00
/acuerdohecho ID_DE_TAREA
```

Sustituye ID_DE_TAREA o ID_DE_SESION por el identificador completo que aparece en la respuesta del bot. No envíes esas palabras literalmente. Para obtenerlo de nuevo, consulta /pendientes, /estudio o /reuniones.

La fecha usa año-mes-día, la letra T y la hora de 24 horas. Por ejemplo, 2026-11-10T18:00 significa 10 de noviembre de 2026 a las 6 de la tarde en Lima.

## Qué se hace desde NEXORA

Crea los planes de estudio y consulta los reportes con los formularios y botones de NEXORA. El bot usa comandos definidos; no interpreta solicitudes escritas libremente como un chat de IA. Solo acepta el chat privado autorizado.


<!-- página siguiente -->

# Solución de problemas frecuentes

## Safari no abre NEXORA o n8n

Comprueba que estás usando esta Mac, que Docker Desktop funciona y que web, n8n y automation están en ejecución dentro de nexora-ta4. Espera unos segundos y recarga Safari. Si el proyecto no aparece, ejecuta el arranque de la página 2.

## Aparece Automatizaciones locales sin conexión

Pulsa «Actualizar pendientes». Si continúa, revisa los tres servicios en Docker. Tras actualizar el proyecto, el arranque de la página 2 reconstruye la instalación y publica los flujos. Conserva el mensaje de error si necesitas ayuda.

## Terminal dice que Docker no está disponible

Abre Docker Desktop y espera a que termine de iniciar el motor. Después repite ./scripts/start_automations_local.sh desde la carpeta del proyecto. Si indica que no encuentra node, instala o habilita Node.js 24 antes de repetir la preparación.

## El bot no responde

Comprueba «Telegram activo», que escribes al bot correcto y que la Mac sigue despierta. Espera unos segundos y revisa «Historial y estado». Prueba Internet desde la Mac. Si aparece un tiempo de espera, cambia de red y vuelve a probar /ayuda. En esta Mac funcionó con datos móviles.

Si el error indica conflicto o webhook, deja de usar ese token en otra instalación o pide ayuda para revisar la integración. No necesitas pagar n8n Cloud para resolverlo. Solo el chat autorizado podrá ejecutar comandos.

## No aparece el identificador o un comando falla

El número del chat se obtiene con «Buscar mi chat» después de enviar /start. Los identificadores de tareas y sesiones se obtienen consultando al bot. Revisa que copiaste el ID completo, el carácter | y una fecha válida. /ayuda muestra el formato.

## El cambio no se ve o el horario de estudio falla

Pulsa «Actualizar pendientes». Las tareas completadas dejan de aparecer entre los pendientes. Para una sesión, elige un horario futuro que no se solape con otra y termine antes del examen. Comprueba que las fechas estén en hora de Lima.

## No llegó un aviso durante una interrupción

La Mac dormida o apagada no ejecuta automatizaciones. Al regresar se revisan los pendientes. Los fallos de envío se reintentan hasta diez veces; si siguen pendientes tras corregir la conexión, solicita ayuda para revisarlos. Telegram puede descartar mensajes entrantes pendientes de más de 24 horas.


<!-- página siguiente -->

# Cerrar y conservar la instalación

## Cerrar las ventanas o detener el sistema

Cerrar Safari o Terminal no detiene las automatizaciones que ya están funcionando en Docker. Para detenerlas de forma intencional, abre Docker Desktop > Containers y pulsa Stop en nexora-ta4. Para volver, pulsa Start y sigue la página 1.

Al detener el proyecto, apagar la Mac o dejarla dormir, se interrumpen los horarios automáticos y el bot. Para una demostración, mantén la Mac despierta, Docker activo y la conexión de Internet disponible.

## Qué se guarda

Los volúmenes de Docker conservan tareas, sesiones, acuerdos, reportes, flujos y credenciales. El token del bot se guarda cifrado. La carpeta n8n-local contiene la configuración necesaria para acceder a los datos guardados.

No tienes que volver a escribir el token y el chat después de un reinicio normal. Conserva n8n-local/.env junto con los volúmenes. Evita eliminar los volúmenes o usar una limpieza de Docker que borre sus datos. No ejecutes down -v si quieres conservar la instalación.

## Hacer una copia de seguridad

1. Abre Docker Desktop y comprueba que los servicios estén iniciados.
2. Abre Terminal y ejecuta las dos líneas siguientes. Espera a que termine.
3. El proceso pausa n8n y automation, guarda sus datos y la configuración, y vuelve a iniciar esos dos servicios.
4. Busca la copia en la carpeta n8n-local/backups del proyecto. Cada respaldo tiene fecha y hora en su nombre.

```text
cd /Users/levanx/Documents/NexoraAI
./scripts/backup_automations_local.sh
```

En Finder, usa Ir > Ir a la carpeta y pega esta ruta para localizar las copias:

```text
/Users/levanx/Documents/NexoraAI/n8n-local/backups
```

Los respaldos incluyen credenciales. Consérvalos en un lugar privado. Para recuperarte de una avería de la Mac, conserva además una copia privada fuera de ese equipo. Antes de restaurar, pide apoyo y respalda el estado actual; no mezcles claves de instalaciones distintas.

## Referencia del manual

Versión TA4 del 3 de noviembre de 2026. Los nombres de botones, comandos y horarios corresponden al módulo Automatizaciones del proyecto. Para mantenimiento técnico, consulta docs/AUTOMATIZACIONES_TA4.md. Este manual no modifica las otras secciones de NEXORA.


<!-- página siguiente -->
