const adminActions = new Set(['kick', 'ban', 'unban', 'promote', 'demote', 'group', 'open', 'close', 'abrirgrupo', 'cerrargrupo', 'setname', 'setreglas', 'mute', 'unmute', 'del', 'link', 'admins', 'todos', 'hidetag'])

function jidFromNumber(value) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length >= 7 ? `${digits}@s.whatsapp.net` : null
}

function normalizeJid(jid) {
  return String(jid || '').replace(/:.*@/, '@')
}

function mentioned(message) {
  return message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
}

function quotedParticipant(message) {
  return message.message?.extendedTextMessage?.contextInfo?.participant || null
}

function targetJids({ message, args }) {
  const tagged = mentioned(message)
  if (tagged.length) return [...new Set(tagged)]
  const quoted = quotedParticipant(message)
  if (quoted) return [quoted]
  const fromArgs = args.map(jidFromNumber).filter(Boolean)
  return [...new Set(fromArgs)]
}

async function reply(sock, chat, message, text) {
  await sock.sendMessage(chat, { text }, { quoted: message })
}

async function getGroupContext({ sock, message, chat, isGroup, sender }) {
  if (!isGroup) throw new Error('Este comando solo funciona en grupos.')
  const metadata = await sock.groupMetadata(chat)
  const participants = metadata.participants || []
  const senderId = normalizeJid(sender)
  const botId = normalizeJid(sock.user?.id)
  const senderParticipant = participants.find((p) => normalizeJid(p.id) === senderId)
  const botParticipant = participants.find((p) => normalizeJid(p.id) === botId)
  const senderIsAdmin = Boolean(senderParticipant?.admin)
  const botIsAdmin = Boolean(botParticipant?.admin)
  if (!senderIsAdmin) throw new Error('Solo los administradores del grupo pueden usar este comando.')
  if (adminActions.has(message._command) && !botIsAdmin) throw new Error('Necesito ser administrador del grupo para ejecutar este comando.')
  return { metadata, participants, botIsAdmin }
}

function targetLabel(jids) {
  return jids.map((jid) => `@${jid.split('@')[0]}`).join(', ')
}

async function updateParticipants(context, action, success) {
  const { sock, chat, message, args } = context
  const jids = targetJids({ message, args })
  if (!jids.length) return reply(sock, chat, message, 'Responde al mensaje, etiqueta a un usuario o escribe su número con código de país.')
  if (jids.some((jid) => normalizeJid(jid) === normalizeJid(sock.user?.id))) return reply(sock, chat, message, 'No puedo aplicar esa acción sobre mí mismo.')
  await sock.groupParticipantsUpdate(chat, jids, action)
  await reply(sock, chat, message, `${success}: ${targetLabel(jids)}`)
}

async function groupCommand(context) {
  const { sock, chat, message, args } = context
  const action = (args[0] || '').toLowerCase()
  if (!['open', 'close', 'abrir', 'cerrar'].includes(action)) {
    return reply(sock, chat, message, 'Uso: .group open | .group close')
  }
  const announce = action === 'close' || action === 'cerrar'
  await sock.groupSettingUpdate(chat, announce ? 'announcement' : 'not_announcement')
  await reply(sock, chat, message, announce ? '🔒 Grupo cerrado: solo administradores pueden escribir.' : '🔓 Grupo abierto: todos pueden escribir.')
}

async function setRules(context) {
  const { sock, chat, message, text, store } = context
  if (!text) return reply(sock, chat, message, 'Uso: .setreglas texto de las reglas')
  store.chats[chat] ||= {}
  store.chats[chat].rules = text
  await reply(sock, chat, message, '✅ Reglas del grupo guardadas.')
}

async function muteUser(context, muted) {
  const { sock, chat, message, args, store } = context
  const jids = targetJids({ message, args })
  if (!jids.length) return reply(sock, chat, message, 'Responde o etiqueta al usuario que deseas silenciar.')
  store.chats[chat] ||= {}
  store.chats[chat].mutedUsers ||= []
  for (const jid of jids) {
    if (muted && !store.chats[chat].mutedUsers.includes(jid)) store.chats[chat].mutedUsers.push(jid)
    if (!muted) store.chats[chat].mutedUsers = store.chats[chat].mutedUsers.filter((item) => item !== jid)
  }
  await reply(sock, chat, message, muted ? `🔇 Usuario silenciado: ${targetLabel(jids)}` : `🔊 Usuario habilitado: ${targetLabel(jids)}`)
}

export const commands = [
  { name: 'kick', async execute(context) { context.message._command = 'kick'; await getGroupContext(context); await updateParticipants(context, 'remove', '👢 Expulsado') } },
  { name: 'ban', async execute(context) { context.message._command = 'ban'; await getGroupContext(context); await updateParticipants(context, 'remove', '⛔ Expulsado') } },
  { name: 'unban', async execute(context) { context.message._command = 'unban'; await getGroupContext(context); await reply(context.sock, context.chat, context.message, 'Para desbloquear a un usuario, usa .invite <número> después de que vuelva a entrar al grupo.') } },
  { name: 'promote', aliases: ['darpoder'], async execute(context) { context.message._command = 'promote'; await getGroupContext(context); await updateParticipants(context, 'promote', '📈 Promovido a administrador') } },
  { name: 'demote', aliases: ['delpoder'], async execute(context) { context.message._command = 'demote'; await getGroupContext(context); await updateParticipants(context, 'demote', '📉 Degradado de administrador') } },
  { name: 'group', aliases: ['grupo'], async execute(context) { context.message._command = 'group'; await getGroupContext(context); await groupCommand(context) } },
  { name: 'open', aliases: ['abrirgrupo'], async execute(context) { context.args = ['open']; context.message._command = 'open'; await getGroupContext(context); await groupCommand(context) } },
  { name: 'close', aliases: ['cerrargrupo'], async execute(context) { context.args = ['close']; context.message._command = 'close'; await getGroupContext(context); await groupCommand(context) } },
  { name: 'setname', async execute(context) { context.message._command = 'setname'; const { sock, chat, message, text } = context; await getGroupContext(context); if (!text) return reply(sock, chat, message, 'Uso: .setname Nuevo nombre'); await sock.groupUpdateSubject(chat, text); await reply(sock, chat, message, '✅ Nombre del grupo actualizado.') } },
  { name: 'setreglas', aliases: ['setrules'], async execute(context) { context.message._command = 'setreglas'; await getGroupContext(context); await setRules(context) } },
  { name: 'reglas', aliases: ['rules'], async execute({ sock, chat, message, store }) { if (!chat.endsWith('@g.us')) return reply(sock, chat, message, 'Este comando solo funciona en grupos.'); await reply(sock, chat, message, `📜 Reglas del grupo:\n${store.chats[chat]?.rules || 'Aún no se han configurado reglas.'}`) } },
  { name: 'mute', async execute(context) { context.message._command = 'mute'; await getGroupContext(context); await muteUser(context, true) } },
  { name: 'unmute', async execute(context) { context.message._command = 'unmute'; await getGroupContext(context); await muteUser(context, false) } },
  { name: 'link', async execute(context) { context.message._command = 'link'; const { sock, chat, message } = context; await getGroupContext(context); const code = await sock.groupInviteCode(chat); await reply(sock, chat, message, `🔗 Enlace del grupo:\nhttps://chat.whatsapp.com/${code}`) } },
  { name: 'admins', async execute(context) { context.message._command = 'admins'; const { sock, chat, message } = context; const { participants } = await getGroupContext(context); const admins = participants.filter((p) => p.admin).map((p) => `@${p.id.split('@')[0]}`).join('\n'); await reply(sock, chat, message, `👮 Administradores:\n${admins || 'Ninguno'}`) } },
  { name: 'todos', aliases: ['hidetag', 'tagall'], async execute(context) { context.message._command = 'todos'; const { sock, chat, message, text } = context; const { participants } = await getGroupContext(context); const mentions = participants.map((p) => p.id); await sock.sendMessage(chat, { text: text || '📣 Atención a todos', mentions }, { quoted: message }) } },
  { name: 'del', aliases: ['delete'], async execute(context) { context.message._command = 'del'; const { sock, chat, message } = context; await getGroupContext(context); const quotedKey = message.message?.extendedTextMessage?.contextInfo?.stanzaId ? { remoteJid: chat, id: message.message.extendedTextMessage.contextInfo.stanzaId, participant: message.message.extendedTextMessage.contextInfo.participant } : null; if (!quotedKey) return reply(sock, chat, message, 'Responde al mensaje que quieres borrar.'); await sock.sendMessage(chat, { delete: quotedKey }); } }
]

export { getGroupContext }
