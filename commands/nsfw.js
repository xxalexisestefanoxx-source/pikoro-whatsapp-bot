const disabled = ['booty', 'ecchi', 'furro', 'lesbianas', 'loli', 'panties', 'pene', 'pechos', 'tetas', 'trapito', 'puto', 'puta', 'horny', 'violar', 'follar', 'penetrar']

export const commands = disabled.map((name) => ({
  name,
  async execute({ sock, chat, message }) {
    await sock.sendMessage(chat, { text: '⚠️ Este comando está deshabilitado por seguridad. PIKORO BOT no genera sexualización, acoso ni violencia dirigida a personas.' }, { quoted: message })
  }
}))
