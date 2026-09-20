import fs from 'node:fs/promises'
import path from 'node:path'
import { getChat } from './lib/store.js'
import { getGroupContext, matchesIdentity, isAdminParticipant } from './commands/groups.js'

const PREFIX = (process.env.BOT_PREFIX || (process.env.PREFIX?.length === 1 ? process.env.PREFIX : '.')).trim() || '.'
const commands = new Map()
const linkPattern = /(https?:\/\/|www\.|chat\.whatsapp\.com|whatsapp\.com\/channel|wa\.me|tiktok\.com|instagram\.com|facebook\.com|youtube\.com|youtu\.be|t\.me|telegram\.me)/i
const recentMessages = new Map()

export function getCommandNames() {
  return [...new Set([...commands.values()].map((command) => command.name))].sort((a, b) => a.localeCompare(b))
}

export function getPrefix() {
  return PREFIX
}

export async function loadCommands() {
  const dir = path.resolve('commands')
  commands.clear()
  const files = (await fs.readdir(dir)).filter((file) => file.endsWith('.js')).sort()
  for (const file of files) {
    const module = await import(`./commands/${file}?v=${Date.now()}`)
    for (const command of module.commands || []) {
      if (!command?.name || typeof command.execute !== 'function') continue
      for (const name of [command.name, ...(command.aliases || [])]) commands.set(name.toLowerCase(), command)
    }
  }
  console.log(`[commands] ${commands.size} alias(es) cargado(s)`)
}

function messageText(message) {
  const content = message.message || {}
  return content.conversation || content.extendedTextMessage?.text || content.imageMessage?.caption || content.videoMessage?.caption || ''
}

function participantIsAdmin(metadata, identities) {
  return (metadata.participants || []).some((participant) => matchesIdentity(participant, identities) && isAdminParticipant(participant))
}

async function moderateIncoming(sock, message, store, context, text) {
  const config = getChat(store, context.chat)
  if (config.bannedUsers?.some((jid) => matchesIdentity({ id: jid }, context.senderIds))) return true
  if (!text || !context.isGroup) return false
  const metadata = await sock.groupMetadata(context.chat)
  const senderAdmin = participantIsAdmin(metadata, context.senderIds)
  const botAdmin = participantIsAdmin(metadata, [sock.user?.id, sock.user?.lid, sock.user?.phoneNumber])
  if (senderAdmin || !botAdmin) return false

  let violation = null
  if (config.antilink && linkPattern.test(text)) violation = '🚫 Enlace eliminado por la configuración del grupo.'
  if (config.antimention && (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length || 0) >= 5) violation = '🚫 Menciones masivas bloqueadas.'

  const key = `${context.chat}:${context.sender}`
  const now = Date.now()
  const history = recentMessages.get(key) || []
  const fingerprint = text.trim().toLowerCase()
  const recent = history.filter((item) => now - item.time < 10_000)
  recent.push({ time: now, fingerprint })
  recentMessages.set(key, recent.slice(-12))
  if (config.antispam && recent.filter((item) => item.fingerprint === fingerprint).length >= 3) violation = '🚫 Spam repetido eliminado.'
  if (config.antiflood && recent.length >= 6) violation = '🚫 Flood detectado y eliminado.'

  if (!violation) return false
  await sock.sendMessage(context.chat, { delete: message.key }).catch(() => {})
  await sock.sendMessage(context.chat, { text: violation }, { quoted: message }).catch(() => {})
  return true
}

export async function handleMessage(sock, message, store) {
  const text = messageText(message)
  const chat = message.key.remoteJid
  const isGroup = chat?.endsWith('@g.us')
  if (!message.message || chat === 'status@broadcast') return
  const sender = message.key.participant || chat
  const senderIds = [message.key.participant, message.key.participantAlt, message.participant, message.participantAlt, message.key.senderPn, message.key.senderLid].filter(Boolean)
  const context = { sock, message, store, chat, sender, senderIds, isGroup }

  if (isGroup) {
    const config = getChat(store, chat)
    config.activity ||= {}
    config.activity[sender] = Date.now()
    if (await moderateIncoming(sock, message, store, context, text)) return
  }
  if (!text.startsWith(PREFIX)) return
  const [rawCommand, ...args] = text.slice(PREFIX.length).trim().split(/\s+/)
  const command = commands.get(rawCommand?.toLowerCase())
  if (!command) return

  const fullContext = { ...context, args, text: args.join(' ') }
  if (isGroup) {
    const config = getChat(store, chat)
    if (config.bannedUsers?.some((jid) => matchesIdentity({ id: jid }, senderIds))) return
  }
  try {
    await command.execute(fullContext)
  } catch (error) {
    console.error(`[command:${rawCommand}]`, error?.stack || error)
    await sock.sendMessage(chat, { text: `⚠️ ${error?.message || 'Ocurrió un error ejecutando el comando.'}` }, { quoted: message }).catch(() => {})
  }
}
