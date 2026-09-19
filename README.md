# PIKORO WHATSAPP BOT

Base modular para un bot de WhatsApp con Node.js, Baileys y prefijo nativo `.`. La arquitectura toma como referencia la separación de `main.js`, `handler.js`, `commands/` y persistencia local observada en [nexusday/pain-bot](https://github.com/nexusday/pain-bot), sin copiar credenciales ni sesiones.

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

El prefijo se controla desde `PREFIX` y por defecto es `.`.

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
