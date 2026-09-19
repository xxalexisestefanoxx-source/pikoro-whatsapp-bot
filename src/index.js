import os from 'node:os'
import { PREFIX, BOT_NAME, OWNER_NUMBER } from '../config/constants.js'
import { MENU } from './menu.js'
import { store, saveStore, groupData } from '../lib/store.js'

const all = `owner grupos menu menu2 menu3 menu4 guía ping runtime reportar imagen ytsearch tiktoksearch record del link block unblock kick ruletaban admins mute unmute pais todos banchat unbanchat horario hidetag reglas fantasmas kickfantasmas nuevolink donarsala sorteo invite group grupo setname setreglas abrirgrupoen cerrargrupo setwelcome delwelcome setbye delbye promote demote darpoder delpoder play play1 play2 spotify ig fb tiktok tiktokimg autoadmin ban unban dargod delgod dsowner chetar join reiniciar salir update gp gpr gs sadcat tweet enable disable gtts clima Ia reenviar ver togifaud tomp3 hd whatmusic abrazar acariciar acertijo dado advpeli minovia minovio gay lesbiana pajero peruano peruana pajera puto puta manco manca rata prostituta prostituto cachuda negra adoptado sintetas sinpoto sinpito feo cachudo negro adoptada nombreninja penetrar consejo dance follar formarpareja horny iqtest besar love personalidad piropo poema ppt pregunta reto triste ship ship5 slot top violar zodiac perfil reg unreg claim crimen levelup minar tienda comprar Buy Buyall work qc scat sticker toimg tovid wm brat bratvideo booty ecchi furro lesbianas loli panties pene pechos tetas trapito`.split(' ')
const unsafe = new Set(['penetrar','follar','violar','loli','booty','ecchi','furro','lesbianas','panties','pene','pechos','tetas','trapito'])
const commands = new Map()
const add = (names, fn) => names.split('|').forEach(n => commands.set(n.toLowerCase(), fn))
const reply = (text) => async ({ sock, jid }) => sock.sendMessage(jid, { text })
add('menu', reply(MENU)); add('menu2|menu3|menu4', reply(MENU))
add('ping', reply('🏓 Pong!')); add('owner', reply(`👤 Owner: ${OWNER_NUMBER || 'configura OWNER_NUMBER en .env'}`))
add('runtime', async ({ sock, jid }) => sock.sendMessage(jid, { text: `⏳ Activo: ${Math.floor(process.uptime())} segundos` }))
add('grupos', reply('🌟 Comando de grupos listo.')); add('guía', reply(`📖 Usa ${PREFIX}menu para ver todos los comandos.`))
add('dado', async ({ sock, jid }) => sock.sendMessage(jid, { text: `🎲 Resultado: ${1 + Math.floor(Math.random()*6)}` })); add('acertijo', reply('❓ ¿Qué tiene agujas y no cose? Un reloj.'))
add('reg', async ({ sock, jid, sender, args }) => { const [name, age] = args.join(' ').split('.'); if (!name || !age) return sock.sendMessage(jid,{text:`Uso: ${PREFIX}reg nombre.edad`}); store.users[sender] = { name, age: Number(age) }; saveStore(); return sock.sendMessage(jid,{text:`✅ Registro completado: ${name}, ${age} años.`}) })
add('unreg', async ({ sock, jid, sender }) => { delete store.users[sender]; saveStore(); return sock.sendMessage(jid,{text:'🗑️ Registro eliminado.'}) })
add('perfil', async ({ sock, jid, sender }) => { const u=store.users[sender]; return sock.sendMessage(jid,{text:u?`📝 Perfil\nNombre: ${u.name}\nEdad: ${u.age}`:'No estás registrado. Usa .reg nombre.edad'}) })
add('reglas', async ({sock,jid,isGroup,groupJid}) => sock.sendMessage(jid,{text:isGroup?groupData(groupJid).rules||'📜 No hay reglas configuradas.':'Este comando es para grupos.'}))
add('setreglas', async ({sock,jid,isGroup,groupJid,args,isAdmin}) => { if(!isGroup||!isAdmin)return sock.sendMessage(jid,{text:'⛔ Solo administradores en grupos.'}); groupData(groupJid).rules=args.join(' '); saveStore(); return sock.sendMessage(jid,{text:'✅ Reglas actualizadas.'}) })
add('enable|disable', async ({sock,jid,args,isOwner,command}) => {
  if (!isOwner) return sock.sendMessage(jid,{text:'⛔ Solo el owner.'})
  const c=args[0]?.toLowerCase()
  if (!c) return sock.sendMessage(jid,{text:`Uso: ${PREFIX}${command} <comando>`})
  if (command.toLowerCase() === 'disable' && !store.disabled.includes(c)) store.disabled.push(c)
  if (command.toLowerCase() === 'enable') store.disabled = store.disabled.filter(x=>x!==c)
  saveStore(); return sock.sendMessage(jid,{text:`✅ ${c}: ${command.toLowerCase() === 'disable' ? 'deshabilitado' : 'habilitado'}.`})
})
for (const name of all) if (!commands.has(name.toLowerCase())) commands.set(name.toLowerCase(), async ({sock,jid}) => sock.sendMessage(jid,{text: unsafe.has(name.toLowerCase())?'🚫 Este comando está deshabilitado por seguridad.':'🛠️ Comando registrado; conecta aquí su módulo específico (descargas, multimedia o administración).'}))
export async function dispatch(ctx) { const fn=commands.get(ctx.command.toLowerCase()); if(!fn) return; if(store.disabled.includes(ctx.command.toLowerCase()) && !ctx.isOwner) return; return fn(ctx) }
export { commands }
