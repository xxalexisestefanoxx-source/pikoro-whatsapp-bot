# Auditoría de PIKORO WhatsApp Bot

## Estado del proyecto analizado

El proyecto existente se conservó y se actualizó de forma incremental. La base usa **Node.js 20 o superior**, módulos ESM y **`@whiskeysockets/baileys` 7.0.0-rc.9** según `package.json` y `package-lock.json`. La arquitectura mantiene `commands/`, `handler.js`, `main.js`, `lib/store.js` y `storage/database.json`. La persistencia sigue siendo JSON local; no se sustituyó ni se migró a otra base de datos.

La instalación y las verificaciones locales no requieren API keys. La conexión de WhatsApp continúa usando la sesión Baileys existente en `sessions/`.

## Auditoría funcional

| Comando o módulo | Estado | API | Solución actual |
|---|---|---:|---|
| `.menu`, `.help` | 🟢 Funciona sin API | No | Menú generado desde comandos realmente cargados; no muestra capacidades ausentes. |
| `.ping`, `.runtime`, `.owner` | 🟢 Funciona sin API | No | Estado, uptime, memoria, grupos y usuarios desde el proceso local. |
| `.kick`, `.ban`, `.unban` | 🟢 Funciona sin API | No | Operaciones Baileys, permisos de admin, protección del bot y estado persistido. |
| `.promote`, `.demote` | 🟢 Funciona sin API | No | Operaciones Baileys con validación de grupo, actor y bot administrador. |
| `.group open`, `.group close`, `.open`, `.close` | 🟢 Funciona sin API | No | `groupSettingUpdate` de Baileys. |
| `.setname`, `.setdesc` | 🟢 Funciona sin API | No | Actualización directa de metadatos del grupo mediante Baileys. |
| `.setreglas`, `.reglas` | 🟢 Funciona sin API | No | Persistencia por grupo en `storage/database.json`. |
| `.link`, `.nuevolink` | 🟢 Funciona sin API | No | Invitación y renovación con Baileys. |
| `.admins`, `.miembros`, `.todos`, `.hidetag` | 🟢 Funciona sin API | No | Metadatos de grupo y menciones directas. |
| `.mute`, `.unmute`, `.del` | 🟢 Funciona sin API | No | Estado local para mute y eliminación de mensajes citados. |
| `.clear @usuario` | 🔵 Funciona localmente | No | Registra hasta 5000 claves por grupo, elimina las del usuario mencionado o citado y reporta únicamente eliminaciones confirmadas. Requiere administrador del grupo o OWNER y que el bot sea administrador. |
| `.antilink` | 🟢 Funciona sin API | No | Detección local de enlaces y eliminación cuando el bot es administrador. |
| `.antispam`, `.antiflood` | 🔵 Funciona localmente | No | Ventanas de tiempo en memoria por grupo/usuario; se reinician al reiniciar el proceso. |
| `.antimention` | 🔵 Funciona localmente | No | Bloqueo de menciones masivas mediante el contenido del mensaje. |
| `.antibot` | 🔴 No disponible | No | El interruptor se conserva como configuración, pero Baileys no ofrece una identificación fiable de “bot” para expulsión automática. |
| `.welcome`, `.goodbye`, `.setwelcome`, `.setbye` | 🟢 Funciona sin API | No | Plantillas por grupo, activación independiente y variables `@user`, `@group`, `@count`, `@owner`. |
| `.reg`, `.unreg`, `.perfil` | 🟢 Funciona sin API | No | Perfil local existente. |
| `.claim`, `.work`, `.minar`, `.levelup`, `.tienda`, `.comprar` | 🟢 Funciona sin API | No | RPG local existente conservado. |
| `.qc`, `.brat` | 🔵 Funciona localmente | No | Respuesta segura de texto; no se inventan endpoints de generación de imágenes. |
| `.play`, `.spotify`, `.tiktok`, `.ig`, `.fb`, `.sticker`, `.toimg`, `.tovid`, `.tomp3` | 🔴 No disponible | No | No estaban implementados en la base activa; se mantienen fuera del menú hasta incorporar herramientas reales como `yt-dlp`/FFmpeg y validarlas. |
| `.ia`, `.ai`, `.clima`, `.gtts`, `.translate`, `.whatmusic` | 🔴 No disponible | Sí / proveedor externo | No se inventan URLs ni claves. Quedan fuera del menú hasta configurar un proveedor autorizado. |
| Juegos y comandos sociales existentes | 🟢 Funciona sin API | No | Se conservan los módulos actuales; no se agregaron respuestas ofensivas o NSFW. |

Los estados anteriores describen implementación y pruebas estáticas/smoke; no significan que se haya conectado una cuenta real de WhatsApp desde este entorno.

## Cambios realizados

### Funciones corregidas

Se reforzó el cargador de comandos para evitar registros duplicados, se agregaron captions de imágenes y videos a la extracción de texto, se normalizó la persistencia con escritura atómica y valores por defecto por grupo, y se añadió cierre limpio ante `SIGINT`/`SIGTERM`. También se corrigió la separación entre configuración de cada grupo y estado global.

La moderación ahora valida grupo, identidad del remitente, privilegios del remitente, privilegios del bot y objetivos protegidos. Los comandos que muestran participantes prefieren el número telefónico disponible en los metadatos en lugar del LID interno. `.ban` y `.unban` conservan una lista por grupo; `.clear` registra claves de mensajes entrantes por usuario y las elimina mediante Baileys; la automatización antilink, antispam, antiflood y antimention opera únicamente en el grupo que la activó.

### Funciones nuevas

Se incorporaron `.setdesc`, `.nuevolink`, `.welcome on/off`, `.goodbye on/off`, `.antispam`, `.antiflood`, `.antibot` y `.antimention`. El menú se genera a partir del registro real de comandos y muestra solamente comandos instalados. El estado de `.ping` incluye memoria, uptime, grupos y usuarios.

### Funciones no activadas

No se añadieron descargas, scraping, conversión multimedia ni IA ficticia. Estas capacidades requieren dependencias o servicios que deben instalarse y validarse de manera independiente; por eso no se anuncian como funcionales en el menú.

## Dependencias y servicios externos

No se agregaron dependencias nuevas. El proyecto conserva Baileys, dotenv, Express, pino y qrcode-terminal. No se usan API keys, tokens de terceros ni endpoints inventados. La única comunicación externa prevista por el runtime es la conexión legítima de Baileys con WhatsApp.

## Verificación ejecutada

Se ejecutó `npm ci`, se validaron todos los archivos JavaScript con `node --check`, se ejecutó `git diff --check` y se cargaron todos los módulos de comandos en una prueba smoke. El resultado fue **134 aliases cargados y 117 comandos únicos**.

## Problemas pendientes

La automatización requiere que el bot sea administrador del grupo y las operaciones dependen de las reglas vigentes de WhatsApp. El antispam y antiflood mantienen ventanas en memoria, por lo que no persisten entre reinicios. `.clear` solo puede borrar el historial que el bot haya registrado desde esta actualización y conserva como máximo 5000 claves por grupo para evitar crecimiento ilimitado. Para habilitar descargas o multimedia real se debe elegir y probar explícitamente `yt-dlp`, FFmpeg y los límites de tamaño/timeout en el entorno de despliegue. Para IA, clima, traducción o TTS se necesita un proveedor externo o una instalación local; no se incluyó ninguno por la restricción de no usar claves.
