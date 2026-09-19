import fs from 'node:fs/promises'
import path from 'node:path'

// Termux defines PREFIX globally as its installation path. Only accept a
// one-character command prefix from PREFIX; otherwise use the bot default.
const PREFIX = (process.env.BOT_PREFIX || (process.env.PREFIX?.length === 1 ? process.env.PREFIX : '.')).trim()
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
  console.log(`[handler] prefix=${JSON.stringify(PREFIX)} startsWith=${text.startsWith(PREFIX)} text=${JSON.stringify(text)}`)
  if (!text.startsWith(PREFIX)) return
  const [rawCommand, ...args] = text.slice(PREFIX.length).trim().split(/\s+/)
  const command = commands.get(rawCommand?.toLowerCase())
  console.log(`[dispatch] command=${rawCommand || 'empty'} found=${Boolean(command)} chat=${message.key.remoteJid || 'unknown'}`)
  if (!command) return

  const context = {
    sock,
    message,
    store,
    args,
    text: args.join(' '),
    chat: message.key.remoteJid,
    sender: message.key.participant || message.key.remoteJid,
    senderIds: [
      message.key.participant,
      message.key.participantAlt,
      message.participant,
      message.participantAlt,
      message.key.senderPn,
      message.key.senderLid
    ].filter(Boolean),
    isGroup: message.key.remoteJid?.endsWith('@g.us')
  }
  if (context.isGroup) {
    store.chats[context.chat] ||= {}
    store.chats[context.chat].activity ||= {}
    store.chats[context.chat].activity[context.sender] = Date.now()
    if (store.chats[context.chat].banned && !['unbanchat', 'owner'].includes(rawCommand?.toLowerCase())) return
  }
  if (store.settings[context.chat]?.enabled === false && rawCommand?.toLowerCase() !== 'enable') return
  try {
    await command.execute(context)
    console.log(`[dispatch] completed=${rawCommand}`)
  } catch (error) {
    console.error(`[command:${rawCommand}]`, error?.stack || error)
    const detail = error?.message || 'Ocurrió un error ejecutando el comando.'
    await sock.sendMessage(context.chat, { text: `⚠️ ${detail}` }, { quoted: message })
  }
}
