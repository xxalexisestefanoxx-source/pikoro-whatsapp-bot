import 'dotenv/config'
import http from 'node:http'
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import P from 'pino'
import qrcode from 'qrcode-terminal'
import { PREFIX, OWNER_NUMBER, BOT_NAME } from './config/constants.js'
import { dispatch } from './commands/index.js'

const normalize = n => (n || '').replace(/[^0-9]/g, '')
const isOwnerOf = jid => normalize(jid).startsWith(normalize(OWNER_NUMBER)) && normalize(OWNER_NUMBER).length > 0
let startedAt = Date.now()
let pairingRequested = false

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(process.env.AUTH_DIR || 'auth_info_baileys')
  const { version } = await fetchLatestBaileysVersion()
  const sock = makeWASocket({
    version,
    auth: state,
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: [BOT_NAME, 'Chrome', '1.0.0']
  })

  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr && !process.env.PAIRING_NUMBER) qrcode.generate(qr, { small: true })
    if (!state.creds.registered && process.env.PAIRING_NUMBER && !pairingRequested) {
      pairingRequested = true
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(normalize(process.env.PAIRING_NUMBER))
          console.log(`PAIRING_CODE=${code}`)
        } catch (error) {
          pairingRequested = false
          console.error('No se pudo generar el código de vinculación.')
        }
      }, 3000)
    }
    if (connection === 'open') console.log(`${BOT_NAME} conectado.`)
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      if (code !== DisconnectReason.loggedOut) start()
      else console.error('Sesión cerrada: elimina auth_info_baileys y vuelve a vincular.')
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if (!m?.message || m.key.fromMe) return
    const jid = m.key.remoteJid
    const text = m.message.conversation || m.message.extendedTextMessage?.text || ''
    if (!text.startsWith(PREFIX)) return
    const body = text.slice(PREFIX.length).trim()
    const [raw, ...args] = body.split(/\\s+/)
    if (!raw) return
    const metadata = jid.endsWith('@g.us') ? await sock.groupMetadata(jid).catch(() => null) : null
    const sender = m.key.participant || jid
    const admins = metadata?.participants?.filter(p => p.admin).map(p => p.id) || []
    const isAdmin = admins.includes(sender)
    const isOwner = isOwnerOf(sender)
    await dispatch({ sock, m, jid, sender, args, command: raw, isGroup: !!metadata, groupJid: jid, isAdmin, isOwner, startedAt })
  })
}

const port = Number(process.env.PORT || 10000)
http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' })
  res.end(`${BOT_NAME} activo\\n`)
}).listen(port, '0.0.0.0', () => console.log(`Health server activo en ${port}`))

start().catch(console.error)
