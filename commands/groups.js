import { forgetMessages, getChat } from '../lib/store.js'

const adminActions = new Set(['kick', 'ban', 'unban', 'promote', 'demote', 'group', 'open', 'close', 'abrirgrupo', 'cerrargrupo', 'setname', 'setdesc', 'setreglas', 'mute', 'unmute', 'del', 'clear', 'link', 'nuevolink', 'admins', 'miembros', 'todos', 'hidetag', 'antilink', 'antispam', 'antiflood', 'antibot', 'antimention', 'approve', 'reject'])

function jidFromNumber(value) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length >= 7 ? `${digits}@s.whatsapp.net` : null
}

function identityKeys(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return []
  const normalized = raw.replace(/:.*@/, '@').replace('@c.us', '@s.whatsapp.net')
  const number = normalized.split('@')[0].replace(/\D/g, '')
  return [...new Set([normalized, number && `number:${number}`].filter(Boolean))]
}

function participantKeys(participant) {
  return [participant?.id, participant?.jid, participant?.lid, participant?.phoneNumber, participant?.phone].flatMap(identityKeys)
}

export function matchesIdentity(participant, identities) {
  const known = new Set((identities || []).flatMap(identityKeys))
  return participantKeys(participant).some((key) => known.has(key))
}

export function isAdminParticipant(participant) {
  return participant?.admin === 'admin' || participant?.admin === 'superadmin' || participant?.admin === true
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
  return [...new Set(args.map(jidFromNumber).filter(Boolean))]
}

async function reply(sock, chat, message, text, mentions) {
  await sock.sendMessage(chat, { text, ...(mentions?.length ? { mentions } : {}) }, { quoted: message })
}

export async function getGroupContext({ sock, message, chat, isGroup, sender, senderIds }) {
  if (!isGroup) throw new Error('Este comando solo funciona en grupos.')
  const metadata = await sock.groupMetadata(chat)
  const participants = metadata.participants || []
  const senderIdentities = senderIds?.length ? senderIds : [sender]
  const botIdentities = [sock.user?.id, sock.user?.lid, sock.user?.jid, sock.user?.phoneNumber, sock.user?.id?.split(':')[0]].filter(Boolean)
  const ownerIdentities = [process.env.OWNER_NUMBER, jidFromNumber(process.env.OWNER_NUMBER)].filter(Boolean)
  const senderParticipant = participants.find((p) => matchesIdentity(p, senderIdentities))
  const botParticipant = participants.find((p) => matchesIdentity(p, botIdentities))
  const senderIsAdmin = isAdminParticipant(senderParticipant)
  const botIsAdmin = isAdminParticipant(botParticipant)
  const senderIsOwner = ownerIdentities.some((owner) => identityKeys(owner).some((key) => senderIdentities.flatMap(identityKeys).includes(key)))
  if (!senderIsAdmin && !senderIsOwner) throw new Error('Solo los administradores del grupo pueden usar este comando.')
  if (adminActions.has(message._command) && !botIsAdmin) throw new Error('El bot necesita ser administrador del grupo para ejecutar este comando.')
  return { metadata, participants, botParticipant, botIsAdmin, senderIsAdmin, senderIsOwner }
}

function targetLabel(jids, participants = []) {
  return jids.map((jid) => {
    const participant = participants.find((item) => matchesIdentity(item, [jid]))
    const phone = participant?.phoneNumber || (participant?.id?.endsWith('@s.whatsapp.net') ? participant.id : null)
    return `@${String(phone || jid).split('@')[0]}`
  }).join(', ')
}

async function updateParticipants(context, action, success) {
  const { sock, chat, message, args } = context
  const jids = targetJids({ message, args })
  if (!jids.length) return reply(sock, chat, message, 'Responde al mensaje, etiqueta a un usuario o escribe su número con código de país.')
  if (jids.some((jid) => matchesIdentity({ id: jid }, [sock.user?.id, sock.user?.lid]))) return reply(sock, chat, message, 'No puedo aplicar esa acción sobre mí mismo.')
  await sock.groupParticipantsUpdate(chat, jids, action)
  await reply(sock, chat, message, `${success}: ${targetLabel(jids)}`, jids)
}

async function setToggle(context, key, label) {
  const { sock, chat, message, store } = context
  await getGroupContext(context)
  store.chats[chat] ||= {}
  store.chats[chat][key] = !store.chats[chat][key]
  await reply(sock, chat, message, `${store.chats[chat][key] ? '🔒 Activado' : '🔓 Desactivado'}: ${label}.`)
}

async function clearUserMessages(context) {
  const { sock, chat, message, args, store } = context
  const { participants } = await getGroupContext(context)
  const jids = targetJids({ message, args })
  if (!jids.length) return reply(sock, chat, message, 'Uso: .clear @usuario (también puedes responder a uno de sus mensajes).')
  const label = targetLabel(jids, participants)
  const tracked = getChat(store, chat).messageLog || []
  const candidates = tracked.filter((entry) => jids.some((jid) => matchesIdentity({ id: entry.sender }, [jid])))
  if (!candidates.length) return reply(sock, chat, message, `No hay mensajes registrados de ${label}.`)

  const deleted = []
  for (const entry of candidates) {
    try {
      await sock.sendMessage(chat, { delete: entry.key })
      deleted.push(entry.key)
    } catch (error) {
      console.error('[clear] no se pudo eliminar un mensaje:', error?.message || error)
    }
  }
  forgetMessages(store, chat, deleted)
  await reply(sock, chat, message, `🧹 Se eliminaron ${deleted.length} mensaje(s) de ${label}.`)
}

async function groupCommand(context) {
  const { sock, chat, message, args } = context
  const action = (args[0] || '').toLowerCase()
  if (!['open', 'close', 'abrir', 'cerrar'].includes(action)) return reply(sock, chat, message, 'Uso: .group open | .group close')
  const announce = action === 'close' || action === 'cerrar'
  await sock.groupSettingUpdate(chat, announce ? 'announcement' : 'not_announcement')
  await reply(sock, chat, message, announce ? '🔒 Grupo cerrado: solo administradores pueden escribir.' : '🔓 Grupo abierto: todos pueden escribir.')
}

export const commands = [
  { name: 'kick', async execute(context) { context.message._command = 'kick'; await getGroupContext(context); await updateParticipants(context, 'remove', '👢 Expulsado') } },
  { name: 'ban', async execute(context) { context.message._command = 'ban'; const { store, chat } = context; await getGroupContext(context); const jids = targetJids(context); if (!jids.length) return reply(context.sock, chat, context.message, 'Responde o etiqueta al usuario que deseas banear.'); store.chats[chat] ||= {}; store.chats[chat].bannedUsers = [...new Set([...(store.chats[chat].bannedUsers || []), ...jids])]; await updateParticipants(context, 'remove', '⛔ Baneado') } },
  { name: 'unban', async execute(context) { context.message._command = 'unban'; await getGroupContext(context); const jids = targetJids(context); context.store.chats[context.chat] ||= {}; context.store.chats[context.chat].bannedUsers = (context.store.chats[context.chat].bannedUsers || []).filter((jid) => !jids.includes(jid)); await reply(context.sock, context.chat, context.message, jids.length ? `✅ Baneo retirado: ${targetLabel(jids)}` : 'Responde o etiqueta al usuario.') } },
  { name: 'promote', aliases: ['darpoder'], async execute(context) { context.message._command = 'promote'; await getGroupContext(context); await updateParticipants(context, 'promote', '📈 Promovido a administrador') } },
  { name: 'demote', aliases: ['delpoder'], async execute(context) { context.message._command = 'demote'; await getGroupContext(context); await updateParticipants(context, 'demote', '📉 Degradado de administrador') } },
  { name: 'group', aliases: ['grupo'], async execute(context) { context.message._command = 'group'; await getGroupContext(context); await groupCommand(context) } },
  { name: 'open', aliases: ['abrirgrupo'], async execute(context) { context.args = ['open']; context.message._command = 'open'; await getGroupContext(context); await groupCommand(context) } },
  { name: 'close', aliases: ['cerrargrupo'], async execute(context) { context.args = ['close']; context.message._command = 'close'; await getGroupContext(context); await groupCommand(context) } },
  { name: 'setname', async execute(context) { context.message._command = 'setname'; await getGroupContext(context); if (!context.text) return reply(context.sock, context.chat, context.message, 'Uso: .setname Nuevo nombre'); await context.sock.groupUpdateSubject(context.chat, context.text); await reply(context.sock, context.chat, context.message, '✅ Nombre del grupo actualizado.') } },
  { name: 'setdesc', async execute(context) { context.message._command = 'setdesc'; await getGroupContext(context); if (!context.text) return reply(context.sock, context.chat, context.message, 'Uso: .setdesc Nueva descripción'); await context.sock.groupUpdateDescription(context.chat, context.text); await reply(context.sock, context.chat, context.message, '✅ Descripción actualizada.') } },
  { name: 'setreglas', aliases: ['setrules'], async execute(context) { context.message._command = 'setreglas'; await getGroupContext(context); if (!context.text) return reply(context.sock, context.chat, context.message, 'Uso: .setreglas texto'); context.store.chats[context.chat].rules = context.text; await reply(context.sock, context.chat, context.message, '✅ Reglas guardadas.') } },
  { name: 'reglas', aliases: ['rules'], async execute({ sock, chat, message, store }) { if (!chat?.endsWith('@g.us')) return reply(sock, chat, message, 'Este comando solo funciona en grupos.'); await reply(sock, chat, message, `📜 Reglas del grupo:\n${store.chats[chat]?.rules || 'Aún no se han configurado reglas.'}`) } },
  { name: 'mute', async execute(context) { context.message._command = 'mute'; await getGroupContext(context); const jids = targetJids(context); context.store.chats[context.chat].mutedUsers = [...new Set([...(context.store.chats[context.chat].mutedUsers || []), ...jids])]; await reply(context.sock, context.chat, context.message, jids.length ? `🔇 Silenciado: ${targetLabel(jids)}` : 'Responde o etiqueta al usuario.') } },
  { name: 'unmute', async execute(context) { context.message._command = 'unmute'; await getGroupContext(context); const jids = targetJids(context); context.store.chats[context.chat].mutedUsers = (context.store.chats[context.chat].mutedUsers || []).filter((jid) => !jids.includes(jid)); await reply(context.sock, context.chat, context.message, jids.length ? `🔊 Habilitado: ${targetLabel(jids)}` : 'Responde o etiqueta al usuario.') } },
  { name: 'link', async execute(context) { context.message._command = 'link'; await getGroupContext(context); const code = await context.sock.groupInviteCode(context.chat); await reply(context.sock, context.chat, context.message, `🔗 Enlace del grupo:\nhttps://chat.whatsapp.com/${code}`) } },
  { name: 'nuevolink', async execute(context) { context.message._command = 'nuevolink'; await getGroupContext(context); await context.sock.groupRevokeInvite(context.chat); const code = await context.sock.groupInviteCode(context.chat); await reply(context.sock, context.chat, context.message, `🔄 Enlace renovado:\nhttps://chat.whatsapp.com/${code}`) } },
  { name: 'admins', aliases: ['miembros'], async execute(context) { context.message._command = 'admins'; const { participants } = await getGroupContext(context); const admins = participants.filter(isAdminParticipant); await reply(context.sock, context.chat, context.message, `👮 Administradores (${admins.length}):\n${admins.map((p) => `@${p.id.split('@')[0]}`).join('\n') || 'Ninguno'}`, admins.map((p) => p.id)) } },
  { name: 'todos', aliases: ['hidetag', 'tagall'], async execute(context) { context.message._command = 'todos'; const { participants } = await getGroupContext(context); const mentions = participants.map((p) => p.id); await reply(context.sock, context.chat, context.message, context.text || '📣 Atención a todos', mentions) } },
  { name: 'antilink', async execute(context) { await setToggle(context, 'antilink', 'anti-enlaces') } },
  { name: 'antispam', async execute(context) { await setToggle(context, 'antispam', 'anti-spam') } },
  { name: 'antiflood', async execute(context) { await setToggle(context, 'antiflood', 'anti-flood') } },
  { name: 'antibot', async execute(context) { await setToggle(context, 'antibot', 'anti-bot') } },
  { name: 'antimention', async execute(context) { await setToggle(context, 'antimention', 'anti-mención masiva') } },
  { name: 'clear', async execute(context) { context.message._command = 'clear'; await clearUserMessages(context) } },
  { name: 'del', aliases: ['delete'], async execute(context) { context.message._command = 'del'; await getGroupContext(context); const info = context.message.message?.extendedTextMessage?.contextInfo; if (!info?.stanzaId) return reply(context.sock, context.chat, context.message, 'Responde al mensaje que quieres borrar.'); await context.sock.sendMessage(context.chat, { delete: { remoteJid: context.chat, id: info.stanzaId, participant: info.participant } }) } }
]
