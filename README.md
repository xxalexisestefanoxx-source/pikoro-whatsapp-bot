# 𝙿𝙸𝙺𝙾𝚁𝙾 𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿 𝙱𝙾𝚃

Scaffold Node.js + Baileys con prefijo `.` y registro completo de comandos. `.menu` imprime el bloque de menú en `src/commands/menu.js`.

## Ejecutar

```bash
cp .env.example .env
# Edita OWNER_NUMBER con código de país, sin +
npm install
npm start
```

Escanea el QR mostrado en la terminal. La sesión se guarda en `auth_info_baileys/`.

## Arquitectura

- `src/index.js`: conexión Baileys y parser del prefijo.
- `src/commands/menu.js`: texto completo de `.menu`.
- `src/commands/index.js`: registro, permisos básicos y dispatch de comandos.
- `src/lib/store.js`: persistencia JSON de perfiles y configuración de grupos.

Todos los nombres solicitados quedan registrados y responden de forma segura. Los módulos de descargas, multimedia, clima y administración avanzada deben conectarse a APIs/procesadores concretos antes de usarlos en producción; no se deben fingir resultados.
