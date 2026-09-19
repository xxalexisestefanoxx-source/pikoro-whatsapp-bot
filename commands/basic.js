const startedAt = Date.now()

export const commands = [
  {
    name: 'ping',
    async execute({ sock, chat, message }) {
      await sock.sendMessage(chat, { text: '🏓 Pong' }, { quoted: message })
    }
  },
  {
    name: 'runtime',
    async execute({ sock, chat, message }) {
      const seconds = Math.floor((Date.now() - startedAt) / 1000)
      await sock.sendMessage(chat, { text: `⏳ Runtime: ${seconds}s` }, { quoted: message })
    }
  },
  {
    name: 'owner',
    async execute({ sock, chat, message }) {
      const owner = process.env.OWNER_NUMBER || 'no configurado'
      await sock.sendMessage(chat, { text: `👤 Owner: ${owner}` }, { quoted: message })
    }
  },
  {
    name: 'help',
    aliases: ['ayuda'],
    async execute({ sock, chat, message }) {
      await sock.sendMessage(chat, { text: 'Usa .menu para ver los comandos disponibles.' }, { quoted: message })
    }
  }
]
