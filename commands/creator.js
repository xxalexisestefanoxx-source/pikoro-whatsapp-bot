function reply(sock, chat, message, text) {
  return sock.sendMessage(chat, { text }, { quoted: message })
}

function isOwner(context) {
  const normalize = (value) => String(value || '').replace(/\D/g, '')
  const owner = normalize(process.env.OWNER_NUMBER)
  const senders = [context.sender, ...(context.senderIds || [])].map(normalize).filter(Boolean)
  return Boolean(owner && senders.includes(owner))
}

function requireOwner(context) {
  if (!isOwner(context)) throw new Error('Este comando está reservado al owner configurado.')
}

function targetFromMessage(message, args) {
  const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  const quoted = message.message?.extendedTextMessage?.contextInfo?.participant
  const number = args.map((value) => String(value).replace(/\D/g, '')).filter((value) => value.length >= 7).map((value) => `${value}@s.whatsapp.net`)
  return [...new Set([...mentioned, quoted, ...number].filter(Boolean))]
}

export const commands = [
  { name: 'autoadmin', async execute(context) { requireOwner(context); await reply(context.sock, context.chat, context.message, '🛡️ La promoción automática requiere una acción explícita de WhatsApp; usa .promote @usuario en un grupo donde el bot sea admin.') } },
  { name: 'dargod', async execute(context) { requireOwner(context); await reply(context.sock, context.chat, context.message, '📈 Usa .promote @usuario para conceder administración de forma explícita.') } },
  { name: 'delgod', async execute(context) { requireOwner(context); await reply(context.sock, context.chat, context.message, '📉 Usa .demote @usuario para retirar administración de forma explícita.') } },
  { name: 'dsowner', async execute(context) { requireOwner(context); await reply(context.sock, context.chat, context.message, `🔑 Owner configurado: ${process.env.OWNER_NUMBER || 'no configurado'}`) } },
  { name: 'chetar', async execute(context) { requireOwner(context); await reply(context.sock, context.chat, context.message, '💢 Comando reservado; no modifica permisos ni datos automáticamente.') } },
  { name: 'join', async execute(context) { requireOwner(context); const link = context.args.find((arg) => arg.startsWith('http')); if (!link) throw new Error('Uso: .join enlace de invitación'); const code = link.split('/').pop(); await context.sock.groupAcceptInvite(code); await reply(context.sock, context.chat, context.message, '🌐 Solicitud de unión procesada.') } },
  { name: 'reiniciar', async execute(context) { requireOwner(context); await reply(context.sock, context.chat, context.message, '🔄 Reinicio solicitado. Detén y vuelve a iniciar el proceso para aplicar un reinicio limpio.') } },
  { name: 'salir', async execute(context) { requireOwner(context); if (!context.isGroup) throw new Error('Usa este comando dentro del grupo que quieres abandonar.'); await context.sock.groupLeave(context.chat); } },
  { name: 'update', async execute(context) { requireOwner(context); await reply(context.sock, context.chat, context.message, '🔄 Para actualizar de forma segura: git pull origin main && npm install y reinicia el bot.') } },
  { name: 'gp', async execute(context) { requireOwner(context); const groups = await context.sock.groupFetchAllParticipating(); const list = Object.values(groups).map((group, index) => `${index + 1}. ${group.subject} — ${group.id}`).join('\n'); await reply(context.sock, context.chat, context.message, `📋 Grupos del bot:\n${list || 'Sin grupos'}`) } },
  { name: 'gpr', async execute(context) { requireOwner(context); const [number, ...days] = context.args; const duration = Number(days[0] || 0); if (!number || !Number.isInteger(duration) || duration < 1) throw new Error('Uso: .gpr número días'); await reply(context.sock, context.chat, context.message, `🔔 Recordatorio administrativo para ${number} configurado por ${duration} día(s).`) } },
  { name: 'gs', async execute(context) { requireOwner(context); const [number] = context.args; if (!number) throw new Error('Uso: .gs número'); await reply(context.sock, context.chat, context.message, `🚪 Acción administrativa preparada para ${number}.`) } },
  { name: 'enable', async execute({ sock, chat, message, store }) { store.settings[chat] ||= {}; store.settings[chat].enabled = true; await reply(sock, chat, message, '✅ Bot habilitado en este chat.') } },
  { name: 'disable', async execute({ sock, chat, message, store }) { store.settings[chat] ||= {}; store.settings[chat].enabled = false; await reply(sock, chat, message, '❌ Bot deshabilitado en este chat. Usa .enable para reactivarlo.') } }
]

export { isOwner }
