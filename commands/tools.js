function reply(sock, chat, message, text) {
  return sock.sendMessage(chat, { text }, { quoted: message })
}

export const commands = [
  { name: 'reenviar', async execute({ sock, chat, message }) { const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage; if (!quoted) throw new Error('Responde al mensaje que quieres reenviar.'); await sock.sendMessage(chat, quoted, { quoted: message }) } },
  { name: 'ver', async execute({ sock, chat, message }) { const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage; await reply(sock, chat, message, quoted ? '👀 El mensaje citado está disponible para procesarse.' : '👀 Responde a un mensaje para inspeccionarlo.') } }
]
