import 'dotenv/config'
import express from 'express'
import { startBot } from './main.js'

const app = express()
const port = Number(process.env.PORT || 3000)
app.get('/health', (_req, res) => res.json({ ok: true, bot: 'PIKORO WHATSAPP BOT' }))
app.listen(port, '0.0.0.0', () => console.log(`Health endpoint: http://0.0.0.0:${port}/health`))

process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))
