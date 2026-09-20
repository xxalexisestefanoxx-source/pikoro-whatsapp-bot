import 'dotenv/config'
import express from 'express'
import { startBot, stopBot } from './main.js'

const app = express()
const port = Number(process.env.PORT || 3000)
app.get('/health', (_req, res) => res.json({ ok: true, bot: 'PIKORO WHATSAPP BOT' }))
app.listen(port, '0.0.0.0', () => console.log(`Health endpoint: http://0.0.0.0:${port}/health`))

async function shutdown(signal) {
  console.log(`[process] ${signal}: cerrando PIKORO de forma segura`)
  await stopBot()
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
