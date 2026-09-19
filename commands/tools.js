import { callMediaProvider, callTextProvider } from '../lib/providers.js'

function reply(sock, chat, message, text) {
  return sock.sendMessage(chat, { text }, { quoted: message })
}

export const commands = [
  { name: 'sadcat', async execute({ sock, chat, message, text }) { if (!text) throw new Error('Uso: .sadcat texto'); await reply(sock, chat, message, `😿 ${text}\nhttps://cataas.com/cat/says/${encodeURIComponent(text)}`) } },
  { name: 'tweet', async execute({ sock, chat, message, text }) { if (!text) throw new Error('Uso: .tweet comentario'); await reply(sock, chat, message, `🐦 Comentario preparado:\n“${text}”`) } },
  { name: 'gtts', async execute({ sock, chat, message, text }) { if (!text) throw new Error('Uso: .gtts texto'); await reply(sock, chat, message, `🎙️ Audio TTS:\nhttps://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(text)}&tl=es`) } },
  { name: 'clima', async execute({ sock, chat, message, text }) { if (!text) throw new Error('Uso: .clima ciudad o país'); const response = await fetch(`https://wttr.in/${encodeURIComponent(text)}?format=3`, { headers: { 'User-Agent': 'PIKORO-WHATSAPP-BOT' } }); if (!response.ok) throw new Error('No se pudo consultar el clima.'); await reply(sock, chat, message, `🌦️ ${await response.text()}`) } },
  { name: 'Ia', aliases: ['ia'], async execute({ sock, chat, message, text }) { if (!text) throw new Error('Uso: .Ia pregunta'); const answer = await callTextProvider(text); await reply(sock, chat, message, answer ? `💻 ${answer}` : '💻 Configura AI_API_URL y AI_API_KEY para activar la IA.') } },
  { name: 'reenviar', async execute({ sock, chat, message }) { const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage; if (!quoted) throw new Error('Responde al mensaje que quieres reenviar.'); await sock.sendMessage(chat, quoted, { quoted: message }) } },
  { name: 'ver', async execute({ sock, chat, message }) { const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage; await reply(sock, chat, message, quoted ? '👀 El mensaje citado está disponible para procesarse.' : '👀 Responde a un mensaje para inspeccionarlo.') } },
  { name: 'togifaud', async execute({ sock, chat, message }) { const result = await callMediaProvider({ operation: 'gif', type: 'video' }); await reply(sock, chat, message, result ? `🎥 GIF listo:\n${result.url}` : '🎥 Configura MEDIA_API_URL para activar la conversión GIF.') } },
  { name: 'tomp3', async execute({ sock, chat, message }) { const result = await callMediaProvider({ operation: 'mp3', type: 'audio' }); await reply(sock, chat, message, result ? `🎵 MP3 listo:\n${result.url}` : '🎵 Configura MEDIA_API_URL para activar la conversión MP3.') } },
  { name: 'hd', async execute({ sock, chat, message }) { const result = await callMediaProvider({ operation: 'hd', type: 'image' }); await reply(sock, chat, message, result ? `🖥️ Imagen HD:\n${result.url}` : '🖥️ Configura MEDIA_API_URL para activar la mejora HD.') } },
  { name: 'whatmusic', async execute({ sock, chat, message }) { const result = await callMediaProvider({ operation: 'recognize', type: 'audio' }); await reply(sock, chat, message, result ? `🎧 ${result.title || 'Canción identificada'}\n${result.url || ''}` : '🎧 Configura MEDIA_API_URL para activar el reconocimiento musical.') } }
]
