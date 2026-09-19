function reply(sock, chat, message, text) {
  return sock.sendMessage(chat, { text }, { quoted: message })
}

export const commands = [
  { name: 'sadcat', async execute({ sock, chat, message, text }) { if (!text) throw new Error('Uso: .sadcat texto'); await reply(sock, chat, message, `😿 ${text}\nhttps://cataas.com/cat/says/${encodeURIComponent(text)}`) } },
  { name: 'tweet', async execute({ sock, chat, message, text }) { if (!text) throw new Error('Uso: .tweet comentario'); await reply(sock, chat, message, `🐦 Comentario preparado:\n“${text}”`) } },
  { name: 'gtts', async execute({ sock, chat, message, text }) { if (!text) throw new Error('Uso: .gtts texto'); await reply(sock, chat, message, `🎙️ Audio TTS:\nhttps://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(text)}&tl=es`) } },
  { name: 'clima', async execute({ sock, chat, message, text }) { if (!text) throw new Error('Uso: .clima ciudad o país'); const response = await fetch(`https://wttr.in/${encodeURIComponent(text)}?format=3`, { headers: { 'User-Agent': 'PIKORO-WHATSAPP-BOT' } }); if (!response.ok) throw new Error('No se pudo consultar el clima.'); await reply(sock, chat, message, `🌦️ ${await response.text()}`) } },
  { name: 'Ia', aliases: ['ia'], async execute({ sock, chat, message }) { await reply(sock, chat, message, '💻 La función de IA está registrada, pero requiere configurar una API/modelo en el entorno antes de procesar consultas.') } },
  { name: 'reenviar', async execute({ sock, chat, message }) { const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage; if (!quoted) throw new Error('Responde al mensaje que quieres reenviar.'); await sock.sendMessage(chat, quoted, { quoted: message }) } },
  { name: 'ver', async execute({ sock, chat, message }) { const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage; await reply(sock, chat, message, quoted ? '👀 El mensaje citado está disponible para procesarse.' : '👀 Responde a un mensaje para inspeccionarlo.') } },
  { name: 'togifaud', async execute({ sock, chat, message }) { await reply(sock, chat, message, '🎥 Conversión a GIF registrada. Responde a un video y conecta FFmpeg para producir el archivo.') } },
  { name: 'tomp3', async execute({ sock, chat, message }) { await reply(sock, chat, message, '🎵 Conversión a MP3 registrada. Responde a un video/audio y conecta FFmpeg para producir el archivo.') } },
  { name: 'hd', async execute({ sock, chat, message }) { await reply(sock, chat, message, '🖥️ Mejora HD registrada. Responde a una imagen y conecta Sharp para producir el archivo.') } },
  { name: 'whatmusic', async execute({ sock, chat, message }) { await reply(sock, chat, message, '🎧 Identificación musical registrada. Requiere un proveedor de reconocimiento de audio configurado.') } }
]
