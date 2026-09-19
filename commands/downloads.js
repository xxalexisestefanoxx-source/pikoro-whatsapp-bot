import { callMediaProvider } from '../lib/providers.js'

function reply(sock, chat, message, text) {
  return sock.sendMessage(chat, { text }, { quoted: message })
}

function requireText(text, usage) {
  if (!text) throw new Error(`Uso: ${usage}`)
}

function isUrl(value) {
  try { return ['http:', 'https:'].includes(new URL(value).protocol) } catch { return false }
}

export const commands = [
  { name: 'play', async execute({ sock, chat, message, text }) { requireText(text, '.play canción'); const result = await callMediaProvider({ operation: 'play', query: text, type: 'audio' }); await reply(sock, chat, message, result ? `🎧 ${result.title || 'Audio'}\n${result.url}` : `🎧 Resultado de audio:\nhttps://www.youtube.com/results?search_query=${encodeURIComponent(text)}`) } },
  { name: 'play1', async execute({ sock, chat, message, text }) { requireText(text, '.play1 canción'); const result = await callMediaProvider({ operation: 'play1', query: text, type: 'audio' }); await reply(sock, chat, message, result ? `🎧 ${result.title || 'Audio'}\n${result.url}` : `🎧 Búsqueda de audio:\nhttps://soundcloud.com/search?q=${encodeURIComponent(text)}`) } },
  { name: 'play2', async execute({ sock, chat, message, text }) { requireText(text, '.play2 canción'); const result = await callMediaProvider({ operation: 'play2', query: text, type: 'video' }); await reply(sock, chat, message, result ? `🎥 ${result.title || 'Video'}\n${result.url}` : `🎥 Resultado de video:\nhttps://www.youtube.com/results?search_query=${encodeURIComponent(text)}`) } },
  { name: 'spotify', async execute({ sock, chat, message, text }) { requireText(text, '.spotify canción'); const result = await callMediaProvider({ operation: 'spotify', query: text, type: 'audio' }); await reply(sock, chat, message, result ? `🎧 ${result.title || 'Spotify'}\n${result.url}` : `🎧 Buscar en Spotify:\nhttps://open.spotify.com/search/${encodeURIComponent(text)}`) } },
  { name: 'ig', async execute({ sock, chat, message, text }) { requireText(text, '.ig enlace'); if (!isUrl(text)) throw new Error('Debes proporcionar un enlace válido.'); const result = await callMediaProvider({ operation: 'instagram', url: text, type: 'video' }); await reply(sock, chat, message, result ? `📸 ${result.title || 'Instagram'}\n${result.url}` : `📸 Enlace recibido:\n${text}\nConfigura MEDIA_API_URL para descargarlo.`) } },
  { name: 'fb', async execute({ sock, chat, message, text }) { requireText(text, '.fb enlace'); if (!isUrl(text)) throw new Error('Debes proporcionar un enlace válido.'); const result = await callMediaProvider({ operation: 'facebook', url: text, type: 'video' }); await reply(sock, chat, message, result ? `🎥 ${result.title || 'Facebook'}\n${result.url}` : `🎥 Enlace recibido:\n${text}\nConfigura MEDIA_API_URL para descargarlo.`) } },
  { name: 'tiktok', async execute({ sock, chat, message, text }) { requireText(text, '.tiktok enlace'); if (!isUrl(text)) throw new Error('Debes proporcionar un enlace válido.'); const result = await callMediaProvider({ operation: 'tiktok', url: text, type: 'video' }); await reply(sock, chat, message, result ? `🎥 ${result.title || 'TikTok'}\n${result.url}` : `🎥 Enlace recibido:\n${text}\nConfigura MEDIA_API_URL para descargarlo.`) } },
  { name: 'tiktokimg', async execute({ sock, chat, message, text }) { requireText(text, '.tiktokimg enlace'); if (!isUrl(text)) throw new Error('Debes proporcionar un enlace válido.'); const result = await callMediaProvider({ operation: 'tiktokimg', url: text, type: 'image' }); await reply(sock, chat, message, result ? `🖼️ ${result.title || 'TikTok'}\n${result.url}` : `🖼️ Enlace recibido:\n${text}\nConfigura MEDIA_API_URL para descargarlo.`) } }
]
