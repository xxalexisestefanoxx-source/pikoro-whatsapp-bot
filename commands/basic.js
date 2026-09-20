const startedAt = Date.now()

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  const minutes = Math.floor((seconds % 3_600) / 60)
  const secs = seconds % 60
  return [days ? `${days}d` : '', hours ? `${hours}h` : '', minutes ? `${minutes}m` : '', `${secs}s`].filter(Boolean).join(' ')
}

export const commands = [
  { name: 'ping', async execute({ sock, chat, message, store }) {
    const started = Date.now()
    await sock.sendMessage(chat, { text: `╭─〔 ⚡ PIKORO STATUS 〕\n│ 📡 Estado: Online\n│ ⚡ Ping: ${Date.now() - started}ms\n│ ⏱️ Uptime: ${formatUptime(Math.floor((Date.now() - startedAt) / 1000))}\n│ 💾 RAM: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB\n│ 👥 Grupos: ${Object.keys(store.chats || {}).length}\n│ 👤 Usuarios: ${Object.keys(store.users || {}).length}\n╰────────────────────╯` }, { quoted: message })
  } },
  { name: 'runtime', async execute({ sock, chat, message }) { await sock.sendMessage(chat, { text: `⏳ Runtime: ${formatUptime(Math.floor((Date.now() - startedAt) / 1000))}` }, { quoted: message }) } },
  { name: 'owner', async execute({ sock, chat, message }) { await sock.sendMessage(chat, { text: `👤 Owner: ${process.env.OWNER_NUMBER || 'no configurado'}` }, { quoted: message }) } },
  { name: 'help', aliases: ['ayuda'], async execute({ sock, chat, message }) { await sock.sendMessage(chat, { text: 'Usa .menu para ver los comandos realmente instalados.' }, { quoted: message }) } }
]
