function reply(sock, chat, message, text) {
  return sock.sendMessage(chat, { text }, { quoted: message })
}

function idsFromMessage(message, args = []) {
  const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  const quoted = message.message?.extendedTextMessage?.contextInfo?.participant
  const numbers = args.map((value) => String(value).replace(/\D/g, '')).filter((value) => value.length >= 7).map((value) => `${value}@s.whatsapp.net`)
  return [...new Set([...mentioned, quoted, ...numbers].filter(Boolean))]
}

function requireGroup({ chat, isGroup }) {
  if (!isGroup || !chat?.endsWith('@g.us')) throw new Error('Este comando solo funciona en grupos.')
}

function requireAdmin(metadata, senderIds, ownerNumber) {
  const tokens = (value) => {
    const raw = String(value || '').replace(/:.*@/, '@').replace('@c.us', '@s.whatsapp.net')
    const number = raw.split('@')[0].replace(/\D/g, '')
    return [raw, number && `number:${number}`].filter(Boolean)
  }
  const sender = new Set(senderIds.flatMap(tokens))
  const owner = new Set(tokens(ownerNumber))
  const isOwner = [...sender].some((key) => owner.has(key))
  const isAdmin = (metadata.participants || []).some((participant) => {
    const participantKeys = [participant.id, participant.jid, participant.lid, participant.phoneNumber, participant.phone].flatMap(tokens)
    return participantKeys.some((key) => sender.has(key)) && ['admin', 'superadmin', true].includes(participant.admin)
  })
  if (!isAdmin && !isOwner) throw new Error('Solo los administradores del grupo pueden usar este comando.')
}

async function adminContext(context) {
  requireGroup(context)
  const metadata = await context.sock.groupMetadata(context.chat)
  requireAdmin(metadata, context.senderIds || [context.sender], process.env.OWNER_NUMBER)
  return metadata
}

async function sendGroupList({ sock, chat, message }) {
  const groups = await sock.groupFetchAllParticipating()
  const entries = Object.values(groups).sort((a, b) => String(a.subject).localeCompare(String(b.subject)))
  const text = entries.length ? entries.map((group, index) => `${index + 1}. ${group.subject}\n   ${group.id}`).join('\n') : 'No se encontraron grupos.'
  await reply(sock, chat, message, `🌟 Grupos donde está el bot:\n\n${text}`)
}

async function report(context) {
  const { store, text, sock, chat, message } = context
  if (!text) return reply(sock, chat, message, 'Uso: .reportar descripción del problema')
  store.reports ||= []
  store.reports.push({ chat, sender: context.sender, text, createdAt: new Date().toISOString() })
  await reply(sock, chat, message, '📢 Reporte guardado. Gracias por avisar.')
}

async function record(context) {
  const { store, chat, text, sock, message } = context
  if (!text) return reply(sock, chat, message, 'Uso: .record texto para guardar')
  store.chats[chat] ||= {}
  store.chats[chat].record = text
  await reply(sock, chat, message, '💡 Recordatorio guardado para este chat.')
}

async function toggleBlock(context, unblock) {
  const { sock, chat, message, args } = context
  const [jid] = idsFromMessage(message, args)
  if (!jid) return reply(sock, chat, message, 'Responde, etiqueta o escribe un número con código de país.')
  await sock.updateBlockStatus(jid, unblock ? 'unblock' : 'block')
  await reply(sock, chat, message, `${unblock ? '✅ Desbloqueado' : '🚫 Bloqueado'}: @${jid.split('@')[0]}`)
}

async function groupBanState(context, banned) {
  const metadata = await adminContext(context)
  if (!context.store.chats[context.chat]) context.store.chats[context.chat] = {}
  context.store.chats[context.chat].banned = banned
  await reply(context.sock, context.chat, context.message, banned ? `🚫 Chat bloqueado: ${metadata.subject}` : '✅ Chat desbloqueado.')
}

async function ghosts(context, remove) {
  const metadata = await adminContext(context)
  const chatData = context.store.chats[context.chat] ||= {}
  const activity = chatData.activity || {}
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  const ghosts = metadata.participants.filter((participant) => !participant.admin && (!activity[participant.id] || activity[participant.id] < cutoff))
  if (!ghosts.length) return reply(context.sock, context.chat, context.message, '👻 No hay miembros inactivos de más de 7 días.')
  if (remove) {
    await context.sock.groupParticipantsUpdate(context.chat, ghosts.map((participant) => participant.id), 'remove')
    return reply(context.sock, context.chat, context.message, `👻 Expulsados ${ghosts.length} miembros inactivos.`)
  }
  return reply(context.sock, context.chat, context.message, `👻 Inactivos detectados: ${ghosts.map((p) => `@${p.id.split('@')[0]}`).join(', ')}`)
}

async function scheduledGroup(context, close) {
  await adminContext(context)
  const minutes = Number(context.args[0])
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) return reply(context.sock, context.chat, context.message, `Uso: .${close ? 'cerrar' : 'abrir'}grupoen minutos (1-1440)`)
  await reply(context.sock, context.chat, context.message, `⏰ Grupo ${close ? 'cerrado' : 'abierto'} en ${minutes} minuto(s).`)
  setTimeout(() => context.sock.groupSettingUpdate(context.chat, close ? 'announcement' : 'not_announcement').catch(console.error), minutes * 60_000)
}

async function welcomeSetting(context, type, remove) {
  await adminContext(context)
  const data = context.store.chats[context.chat] ||= {}
  const key = type === 'welcome' ? 'welcome' : 'bye'
  if (remove) delete data[key]
  else if (!context.text) return reply(context.sock, context.chat, context.message, `Uso: .set${key} mensaje`)
  else data[key] = context.text
  await reply(context.sock, context.chat, context.message, remove ? `🗑️ Mensaje de ${key} eliminado.` : `👋 Mensaje de ${key} configurado.`)
}

export const commands = [
  { name: 'grupos', async execute(context) { await sendGroupList(context) } },
  { name: 'guía', aliases: ['guia'], async execute({ sock, chat, message }) { await reply(sock, chat, message, '📖 Guía rápida:\n1. Usa .menu para ver comandos.\n2. En grupos, el bot debe ser administrador.\n3. Para moderar, responde o etiqueta al usuario.\n4. No compartas la carpeta sessions/.') } },
  { name: 'reportar', async execute(context) { await report(context) } },
  { name: 'imagen', async execute({ sock, chat, message, text }) { if (!text) return reply(sock, chat, message, 'Uso: .imagen texto'); await reply(sock, chat, message, `📷 Buscar imágenes:\nhttps://www.bing.com/images/search?q=${encodeURIComponent(text)}`) } },
  { name: 'ytsearch', aliases: ['yt'], async execute({ sock, chat, message, text }) { if (!text) return reply(sock, chat, message, 'Uso: .ytsearch búsqueda'); await reply(sock, chat, message, `🔍 Buscar en YouTube:\nhttps://www.youtube.com/results?search_query=${encodeURIComponent(text)}`) } },
  { name: 'tiktoksearch', async execute({ sock, chat, message, text }) { if (!text) return reply(sock, chat, message, 'Uso: .tiktoksearch búsqueda'); await reply(sock, chat, message, `🎵 Buscar en TikTok:\nhttps://www.tiktok.com/search?q=${encodeURIComponent(text)}`) } },
  { name: 'record', async execute(context) { await record(context) } },
  { name: 'block', async execute(context) { await toggleBlock(context, false) } },
  { name: 'unblock', async execute(context) { await toggleBlock(context, true) } },
  { name: 'pais', async execute({ sock, chat, message, args }) { const value = args.join(' '); await reply(sock, chat, message, value ? `🌎 País/ubicación solicitada: ${value}` : 'Uso: .pais nombre o código de país') } },
  { name: 'banchat', async execute(context) { await groupBanState(context, true) } },
  { name: 'unbanchat', async execute(context) { await groupBanState(context, false) } },
  { name: 'horario', async execute({ sock, chat, message }) { await reply(sock, chat, message, `⏰ Hora del servidor: ${new Date().toLocaleString('es-ES', { timeZone: 'UTC' })} UTC`) } },
  { name: 'fantasmas', async execute(context) { await ghosts(context, false) } },
  { name: 'kickfantasmas', async execute(context) { await ghosts(context, true) } },
  { name: 'nuevolink', async execute(context) { await adminContext(context); const code = await context.sock.groupRevokeInvite(context.chat); const newCode = await context.sock.groupInviteCode(context.chat); await reply(context.sock, context.chat, context.message, `🔄 Enlace renovado:\nhttps://chat.whatsapp.com/${newCode}`) } },
  { name: 'donarsala', async execute({ sock, chat, message }) { await reply(sock, chat, message, '🎁 Si quieres apoyar el bot, contacta al propietario configurado en .owner.') } },
  { name: 'sorteo', async execute(context) { const metadata = await adminContext(context); const candidates = metadata.participants.filter((p) => !p.admin); const winner = candidates[Math.floor(Math.random() * candidates.length)]; await reply(context.sock, context.chat, context.message, winner ? `🎟️ Ganador: @${winner.id.split('@')[0]}` : 'No hay participantes disponibles.') } },
  { name: 'invite', async execute(context) { await adminContext(context); const [jid] = idsFromMessage(context.message, context.args); if (!jid) return reply(context.sock, context.chat, context.message, 'Uso: .invite número'); await context.sock.groupParticipantsUpdate(context.chat, [jid], 'add'); await reply(context.sock, context.chat, context.message, `📲 Invitación enviada a ${jid.split('@')[0]}.`) } },
  { name: 'abrirgrupoen', async execute(context) { await scheduledGroup(context, false) } },
  { name: 'cerrargrupoen', async execute(context) { await scheduledGroup(context, true) } },
  { name: 'setwelcome', async execute(context) { await welcomeSetting(context, 'welcome', false) } },
  { name: 'delwelcome', async execute(context) { await welcomeSetting(context, 'welcome', true) } },
  { name: 'setbye', async execute(context) { await welcomeSetting(context, 'bye', false) } },
  { name: 'delbye', async execute(context) { await welcomeSetting(context, 'bye', true) } }
]
