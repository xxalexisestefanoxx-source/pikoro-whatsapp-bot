function reply(sock, chat, message, text) {
  return sock.sendMessage(chat, { text }, { quoted: message })
}

export const commands = [
  { name: 'qc', async execute({ sock, chat, message, text }) { if (!text) throw new Error('Uso: .qc texto'); await reply(sock, chat, message, `💬 Cita:\n“${text}”`) } },
  { name: 'scat', async execute({ sock, chat, message }) { await reply(sock, chat, message, '💩 Este contenido está deshabilitado por seguridad.') } },
  { name: 'sticker', async execute({ sock, chat, message }) { await reply(sock, chat, message, '🎨 Responde a una imagen o video corto. Para producir stickers reales, conecta Sharp/FFmpeg en el servidor.') } },
  { name: 'toimg', async execute({ sock, chat, message }) { await reply(sock, chat, message, '🖼️ Responde a un sticker. La conversión requiere un procesador de medios configurado.') } },
  { name: 'tovid', async execute({ sock, chat, message }) { await reply(sock, chat, message, '🎥 Responde a un sticker animado. La conversión requiere FFmpeg configurado.') } },
  { name: 'wm', async execute({ sock, chat, message }) { await reply(sock, chat, message, '🗂️ Responde a un sticker e indica el texto de marca de agua. El procesador multimedia aún no está configurado.') } },
  { name: 'brat', async execute({ sock, chat, message, text }) { if (!text) throw new Error('Uso: .brat texto'); await reply(sock, chat, message, `🖼️ Texto Brat preparado: ${text}`) } },
  { name: 'bratvideo', async execute({ sock, chat, message }) { await reply(sock, chat, message, '🖼️ Responde a un video. La generación de Brat video requiere FFmpeg.') } }
]
