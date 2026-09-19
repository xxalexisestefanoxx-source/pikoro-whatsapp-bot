function reply(sock, chat, message, text) {
  return sock.sendMessage(chat, { text }, { quoted: message })
}

export const commands = [
  { name: 'qc', async execute({ sock, chat, message, text }) { if (!text) throw new Error('Uso: .qc texto'); await reply(sock, chat, message, `💬 Cita:\n“${text}”`) } },
  { name: 'brat', async execute({ sock, chat, message, text }) { if (!text) throw new Error('Uso: .brat texto'); await reply(sock, chat, message, `🖼️ Texto Brat: ${text}`) } }
]
