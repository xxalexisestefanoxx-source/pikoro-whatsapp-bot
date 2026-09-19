import fs from 'node:fs/promises'
import path from 'node:path'

const PREFIX = process.env.PREFIX || '.'
const commands = new Map()

export async function loadCommands() {
  const dir = path.resolve('commands')
  const files = (await fs.readdir(dir)).filter((file) => file.endsWith('.js')).sort()
  for (const file of files) {
    const module = await import(`./commands/${file}?v=${Date.now()}`)
    for (const command of module.commands || []) {
      for (const name of [command.name, ...(command.aliases || [])]) commands.set(name.toLowerCase(), command)
    }
  }
  console.log(`[commands] ${commands.size} alias(es) cargado(s)`)
}

export async function handleMessage(sock, message, store) {
  const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
  if (!text.startsWith(PREFIX)) return
  const [rawCommand, ...args] = text.slice(PREFIX.length).trim().split(/\s+/)
  const command = commands.get(rawCommand?.toLowerCase())
  if (!command) return

  const context = {
    sock,
    message,
    store,
    args,
    text: args.join(' '),
    chat: message.key.remoteJid,
    sender: message.key.participant || message.key.remoteJid,
    isGroup: message.key.remoteJid?.endsWith('@g.us')
  }
  try {
    await command.execute(context)
  } catch (error) {
    console.error(`[command:${rawCommand}]`, error)
    await sock.sendMessage(context.chat, { text: 'Ocurrió un error ejecutando el comando.' }, { quoted: message })
  }
}
