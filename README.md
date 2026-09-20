# PIKORO WHATSAPP BOT

Base modular para un bot de WhatsApp con Node.js, Baileys y prefijo nativo `.`. En Termux se configura como `BOT_PREFIX` porque `PREFIX` es una variable reservada por el sistema. La arquitectura toma como referencia la separación de `main.js`, `handler.js`, `commands/` y persistencia local observada en [nexusday/pain-bot](https://github.com/nexusday/pain-bot), sin copiar credenciales ni sesiones.

## Requisitos

Se recomienda Node.js 20 o superior. Las sesiones de WhatsApp se almacenan en `sessions/` y están excluidas de Git. Nunca publiques esa carpeta ni el archivo `.env`.

## Instalación

```bash
cd "PIKORO WHATSAPP BOT"
cp .env.example .env
# Edita .env y establece OWNER_NUMBER, PORT y, si lo deseas, PAIRING_NUMBER.
npm install
npm start
```

Al iniciar por primera vez aparecerá un QR en la terminal. Escanéalo desde WhatsApp > Dispositivos vinculados. Después de vincularse, `.menu`, `.menu2`, `.menu3` y `.menu4` envían el mismo bloque literal especificado para el bot.

## Estructura

| Ruta | Responsabilidad |
|---|---|
| `index.js` | Arranque del proceso y endpoint `/health`. |
| `main.js` | Socket Baileys, QR, credenciales, eventos y reconexión. |
| `handler.js` | Detección del prefijo y despacho modular. |
| `commands/menu.js` | Alias `.menu`, `.menu2`, `.menu3`, `.menu4`. |
| `commands/basic.js` | Comandos base `.ping`, `.runtime`, `.owner`, `.help`. |
| `lib/menu.txt` | Texto exacto del menú solicitado. |
| `lib/store.js` | Persistencia JSON local. |
| `commands/group-tools.js` | Búsquedas, control de chat, invitaciones, bienvenidas y automatizaciones. |
| `commands/downloads.js` | Play, Spotify, Instagram, Facebook y TikTok. |
| `commands/creator.js` | Acciones protegidas por `OWNER_NUMBER`. |
| `commands/tools.js` | Clima, TTS, IA y conversiones conectables. |
| `commands/fun.js` | Juegos y respuestas sociales. |
| `commands/profile.js` | Registro y perfiles. |
| `commands/rpg.js` | Economía, XP, niveles e inventario. |
| `commands/media.js` | Stickers y conversiones multimedia con capacidades declaradas. |
| `commands/nsfw.js` | Respuestas de seguridad para comandos NSFW deshabilitados. |

## Crear o modificar comandos

Cada archivo nuevo dentro de `commands/` debe exportar `commands`, un arreglo de objetos con `name`, `aliases` opcional y `execute(context)`:

```js
export const commands = [{
  name: 'saludo',
  async execute({ sock, chat, message }) {
    await sock.sendMessage(chat, { text: 'Hola' }, { quoted: message })
  }
}]
```

El prefijo se controla desde `BOT_PREFIX` y por defecto es `.`. El código también acepta `PREFIX` cuando no existe el conflicto reservado de Termux.

## Integraciones externas

Las integraciones de APIs, descargas, conversiones multimedia, clima, TTS e IA se eliminaron por ahora. No se solicitan claves ni se realizan conexiones externas. Se podrán reincorporar en módulos separados cuando se configure un proveedor autorizado.

## Despliegue y verificación

El servicio HTTP expone `/health` y escucha en `0.0.0.0:$PORT`, por lo que puede ser usado por Railway u otro proveedor Node.js. Después de desplegar:

```bash
curl http://localhost:3000/health
npm run lint
```

Configura un volumen persistente para `sessions/` y nunca subas `.env`, `sessions/` o claves de APIs al repositorio.

## Moderación esencial de grupos

Los comandos de administración requieren que quien los ejecuta sea administrador y que el bot también sea administrador cuando WhatsApp lo exige. Para dirigirse a una persona, responde a su mensaje, etiquétala o escribe su número con código de país.

```text
.kick @usuario
.ban @usuario
.promote @usuario
.demote @usuario
.group open
.group close
.open
.close
.setname Nuevo nombre
.setreglas texto de las reglas
.reglas
.link
.admins
.todos mensaje opcional
.hidetag mensaje opcional
.mute @usuario
.unmute @usuario
.clear @usuario
.del  (respondiendo a un mensaje)
```

`.clear` elimina los mensajes registrados del usuario mencionado o del usuario cuyo mensaje se está respondiendo, e informa cuántos borrados tuvieron éxito. Solo administradores del grupo o el OWNER pueden ejecutarlo, y el bot debe ser administrador para que WhatsApp permita borrar los mensajes.

Para `.kick`, `.ban`, `.promote`, `.demote`, `.group`, `.open`, `.close`, `.setname`, `.setreglas`, `.link`, `.admins`, `.todos`, `.hidetag`, `.mute`, `.unmute`, `.clear` y `.del`, el bot debe tener privilegios de administrador.

## GitHub

Si el repositorio remoto está vacío o debe recibir esta base por primera vez:

```bash
cd "PIKORO WHATSAPP BOT"
git init
git branch -M main
git remote add origin https://github.com/nexusday/pain-bot.git
git add .
git commit -m "feat: initialize PIKORO WHATSAPP BOT"
git push -u origin main
```

Si `origin` ya existe, usa:

```bash
git remote set-url origin https://github.com/nexusday/pain-bot.git
git add .
git commit -m "feat: update PIKORO WHATSAPP BOT modular base"
git push origin main
```

Antes de hacer `push`, verifica que no se incluyan secretos:

```bash
git status --short
git diff --cached -- .env sessions/
```

Si el remoto contiene commits que no están localmente, sincroniza primero:

```bash
git pull --rebase origin main
git push origin main
```

> El token de GitHub no debe escribirse en el repositorio ni en el README. Usa la autenticación de GitHub CLI, SSH o el gestor de credenciales de Git.
