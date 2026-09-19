import 'dotenv/config'
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState
} from '@whiskeysockets/baileys'
import P from 'pino'
import qrcode from 'qrcode-terminal'
import { handleMessage, loadCommands } from './handler.js'
import { loadStore, saveStore } from './lib/store.js'

const logger = P({ level: process.env.LOG_LEVEL || 'info' })
const store = await loadStore()
await loadCommands()

let reconnectAttempts = 0
let reconnectTimer = null
let activeSocket = null
let starting = false

export async function startBot() {
  if (starting || activeSocket) return
  starting = true
  const { state, saveCreds } = await useMultiFileAuthState('sessions')
  const { version } = await fetchLatestBaileysVersion()
  const sock = makeWASocket({
    version,
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
    browser: Browsers.ubuntu('Chrome'),
    logger,
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    syncFullHistory: false
  })
  activeSocket = sock
  starting = false

  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
    const config = store.chats[id]
    const template = action === 'add' ? config?.welcome : action === 'remove' ? config?.bye : null
    if (!template || !participants?.length) return
    const mentions = participants
    const names = participants.map((jid) => `@${jid.split('@')[0]}`).join(', ')
    await sock.sendMessage(id, { text: template.replaceAll('{user}', names), mentions }).catch((error) => console.error('[welcome/bye]', error.message))
  })
  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) qrcode.generate(qr, { small: true })
    if (connection === 'open') {
      reconnectAttempts = 0
      console.log('✅ PIKORO WHATSAPP BOT conectado')
    }
    if (connection === 'close') {
      if (activeSocket !== sock) return
      activeSocket = null
      const statusCode = lastDisconnect?.error?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut
      console.error(`Conexión cerrada (${statusCode ?? 'desconocido'}). Reconectar: ${shouldReconnect}`)
      if (shouldReconnect) {
        reconnectAttempts += 1
        const delay = Math.min(30_000, 1_000 * 2 ** Math.min(reconnectAttempts, 5))
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null
            startBot().catch((error) => {
              starting = false
              console.error('[reconnect] no se pudo iniciar:', error?.stack || error)
            })
          }, delay)
        }
      } else {
        console.error('Sesión cerrada por WhatsApp. Borra sessions/ y vuelve a vincular.')
      }
    }
  })
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const message of messages) {
      const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
      console.log(`[message] chat=${message.key.remoteJid || 'unknown'} fromMe=${Boolean(message.key.fromMe)} text=${JSON.stringify(text)}`)
      if (!message.message || message.key.remoteJid === 'status@broadcast') continue
      await handleMessage(sock, message, store)
    }
    await saveStore(store)
  })
}

await startBot()
