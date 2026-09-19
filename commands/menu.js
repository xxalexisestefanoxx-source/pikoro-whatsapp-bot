import fs from 'node:fs/promises'

const menu = await fs.readFile(new URL('../lib/menu.txt', import.meta.url), 'utf8')

export const commands = [
  ...['menu', 'menu2', 'menu3', 'menu4'].map((name) => ({
    name,
    async execute({ sock, chat, message }) {
      await sock.sendMessage(chat, { text: menu }, { quoted: message })
    }
  }))
]
