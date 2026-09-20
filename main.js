import 'dotenv/config'
import makeWASocket, { Browsers, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, useMultiFileAuthState } from '@whiskeysockets/baileys'
import P from 'pino'
import qrcode from 'qrcode-terminal'
import { handleMessage, loadCommands } from './handler.js'
import { getChat, loadStore, saveStore } from './lib/store.js'

const logger = P({ level: process.env.LOG_LEVEL || 'info' })
const store = await loadStore()
await loadCommands()
let reconnectAttempts = 0
let reconnectTimer = null
let activeSocket = null
let starting = false
let stopping = false
const startedAt = Date.now()

function renderTemplate(template, { user, group, count, owner }) {
  return String(template || '')
    .replaceAll('{user}', user)
    .replaceAll('@user', user)
    .replaceAll('{group}', group)
    .replaceAll('@group', group)
    .replaceAll('{count}', String(count))
    .replaceAll('{owner}', owner)
    .replaceAll('@owner', owner)
}

export function getRuntimeStats() {
  return {
    startedAt,
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    groups: Object.keys(store.chats || {}).length,
    users: Object.keys(store.users || {}).length,
    memory: process.memoryUsage()
  }
}

export async function startBot() {
  if (stopping || starting || activeSocket) return activeSocket
  starting = true
  const { state, saveCreds } = await useMultiFileAuthState('sessions')
  const { version } = await fetchLatestBaileysVersion()
  const sock = makeWASocket({ version, auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) }, browser: Browsers.ubuntu('Chrome'), logger, printQRInTerminal: false, markOnlineOnConnect: false, syncFullHistory: false })
  activeSocket = sock
  starting = false
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
    const config = getChat(store, id)
    const enabled = action === 'add' ? config.welcomeEnabled : action === 'remove' ? config.byeEnabled : false
    const template = action === 'add' ? config.welcome : action === 'remove' ? config.bye : ''
    if (!enabled || !template || !participants?.length) return
    const metadata = await sock.groupMetadata(id).catch(() => ({ subject: id, participants: [] }))
    const owner = process.env.OWNER_NUMBER || 'no configurado'
    const mentions = participants
    const users = participants.map((jid) => `@${jid.split('@')[0]}`).join(', ')
    const text = renderTemplate(template, { user: users, group: metadata.subject, count: metadata.participants.length, owner })
    await sock.sendMessage(id, { text, mentions }).catch((error) => logger.warn({ err: error }, '[welcome/bye]'))
  })
  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) qrcode.generate(qr, { small: true })
    if (connection === 'open') {
      reconnectAttempts = 0
      console.log('✅ PIKORO WHATSAPP BOT conectado')
    }
    if (connection !== 'close' || activeSocket !== sock) return
    activeSocket = null
    const statusCode = lastDisconnect?.error?.output?.statusCode
    const shouldReconnect = !stopping && statusCode !== DisconnectReason.loggedOut
    if (!shouldReconnect) return console.error(`Sesión cerrada (${statusCode ?? 'desconocido'}). Borra sessions/ y vuelve a vincular si es necesario.`)
    reconnectAttempts += 1
    const delay = Math.min(30_000, 1_000 * 2 ** Math.min(reconnectAttempts, 5))
    clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(() => { reconnectTimer = null; startBot().catch((error) => logger.error({ err: error }, '[reconnect]')) }, delay)
  })
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const message of messages) await handleMessage(sock, message, store)
    await saveStore(store)
  })
  return sock
}

export async function stopBot() {
  stopping = true
  clearTimeout(reconnectTimer)
  reconnectTimer = null
  await saveStore(store)
  if (activeSocket) activeSocket.end?.(new Error('Proceso detenido'))
  activeSocket = null
}

await startBot()
