import fs from 'node:fs/promises'

const menu = await fs.readFile(new URL('../lib/menu.txt', import.meta.url), 'utf8')

export const commands = [{
  name: 'menu',
  async execute({ sock, chat, message }) {
    await sock.sendMessage(chat, { text: menu }, { quoted: message })
  }
}]
