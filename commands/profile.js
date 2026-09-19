function reply(sock, chat, message, text) {
  return sock.sendMessage(chat, { text }, { quoted: message })
}

function userId(context) {
  return context.sender || context.chat
}

export const commands = [
  { name: 'reg', async execute(context) { const match = context.text.match(/^(.+?)[. ](\d{1,3})$/); if (!match) throw new Error('Uso: .reg nombre.edad'); const user = context.store.users[userId(context)] ||= {}; user.name = match[1].trim(); user.age = Number(match[2]); user.registered = true; await reply(context.sock, context.chat, context.message, `📝 Registro completado para ${user.name}, edad ${user.age}.`) } },
  { name: 'unreg', async execute(context) { delete context.store.users[userId(context)]; await reply(context.sock, context.chat, context.message, '🗑️ Registro eliminado.') } },
  { name: 'perfil', async execute(context) { const user = context.store.users[userId(context)]; if (!user?.registered) return reply(context.sock, context.chat, context.message, 'No tienes perfil. Usa .reg nombre.edad'); await reply(context.sock, context.chat, context.message, `📝 Perfil\nNombre: ${user.name}\nEdad: ${user.age}\nNivel: ${user.level || 1}\nMonedas: ${user.coins || 0}`) } }
]
