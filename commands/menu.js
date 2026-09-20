import { getCommandNames, getPrefix } from '../handler.js'

const sections = {
  '🛡️ MODERACIÓN': ['kick', 'ban', 'unban', 'warn', 'warnings', 'mute', 'unmute', 'promote', 'demote', 'admins', 'clear', 'del'],
  '🔐 SEGURIDAD': ['antilink', 'antispam', 'antiflood', 'antibot', 'antimention'],
  '👥 GESTIÓN': ['link', 'nuevolink', 'group', 'setname', 'setdesc', 'setreglas', 'reglas', 'todos', 'hidetag', 'welcome', 'goodbye'],
  '📥 DESCARGAS': ['play', 'ytsearch', 'spotify', 'tiktok', 'ig', 'fb'],
  '🎨 MULTIMEDIA': ['sticker', 'qc', 'brat', 'toimg', 'tovid', 'tomp3'],
  '🤖 IA & TOOLS': ['ia', 'ai', 'clima', 'gtts', 'whatmusic', 'hd', 'ping', 'runtime', 'owner', 'help'],
  '🎮 DIVERSIÓN': ['dado', 'acertijo', 'trivia', 'reto', 'pregunta', 'love', 'ship', 'top'],
  '💎 RPG': ['reg', 'unreg', 'perfil', 'claim', 'work', 'minar', 'levelup', 'tienda', 'comprar'],
  '👑 OWNER': ['join', 'reiniciar', 'salir', 'update']
}

function buildMenu() {
  const installed = new Set(getCommandNames())
  const blocks = Object.entries(sections).map(([title, names]) => {
    const available = names.filter((name) => installed.has(name))
    return available.length ? `╭─〔 ${title} 〕\n${available.map((name) => `│ ${getPrefix()}${name}`).join('\n')}\n╰──────────────────────────────╯` : ''
  }).filter(Boolean)
  return [`╭──────────────────────────────╮`, '│ ⚡ 𝐏𝐈𝐊𝐎𝐑𝐎 𝐖𝐇𝐀𝐓𝐒𝐀𝐏𝐏 𝐁𝐎𝐓', '│ 𝐄𝐋𝐈𝐓𝐄 𝐆𝐑𝐎𝐔𝐏 𝐒𝐘𝐒𝐓𝐄𝐌', '╰──────────────────────────────╯', '', ...blocks, '', '⚡ Secure • Smart • Fast'].join('\n')
}

export const commands = [{
  name: 'menu',
  aliases: ['help', 'ayuda'],
  async execute({ sock, chat, message }) {
    await sock.sendMessage(chat, { text: buildMenu() }, { quoted: message })
  }
}]
