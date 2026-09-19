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
  { name: 'play', async execute({ sock, chat, message, text }) { requireText(text, '.play canción'); await reply(sock, chat, message, `🎧 Resultado de audio para “${text}”:\nhttps://www.youtube.com/results?search_query=${encodeURIComponent(text)}`) } },
  { name: 'play1', async execute({ sock, chat, message, text }) { requireText(text, '.play1 canción'); await reply(sock, chat, message, `🎧 Búsqueda de audio:\nhttps://soundcloud.com/search?q=${encodeURIComponent(text)}`) } },
  { name: 'play2', async execute({ sock, chat, message, text }) { requireText(text, '.play2 canción'); await reply(sock, chat, message, `🎥 Resultado de video:\nhttps://www.youtube.com/results?search_query=${encodeURIComponent(text)}`) } },
  { name: 'spotify', async execute({ sock, chat, message, text }) { requireText(text, '.spotify canción'); await reply(sock, chat, message, `🎧 Buscar en Spotify:\nhttps://open.spotify.com/search/${encodeURIComponent(text)}`) } },
  { name: 'ig', async execute({ sock, chat, message, text }) { requireText(text, '.ig enlace'); if (!isUrl(text)) throw new Error('Debes proporcionar un enlace válido.'); await reply(sock, chat, message, `📸 Enlace de Instagram recibido:\n${text}\n\nEl descargador debe conectarse a un proveedor/API de Instagram autorizado.`) } },
  { name: 'fb', async execute({ sock, chat, message, text }) { requireText(text, '.fb enlace'); if (!isUrl(text)) throw new Error('Debes proporcionar un enlace válido.'); await reply(sock, chat, message, `🎥 Enlace de Facebook recibido:\n${text}\n\nEl descargador debe conectarse a un proveedor/API autorizado.`) } },
  { name: 'tiktok', async execute({ sock, chat, message, text }) { requireText(text, '.tiktok enlace'); if (!isUrl(text)) throw new Error('Debes proporcionar un enlace válido.'); await reply(sock, chat, message, `🎥 Enlace de TikTok recibido:\n${text}\n\nEl descargador debe conectarse a un proveedor/API autorizado.`) } },
  { name: 'tiktokimg', async execute({ sock, chat, message, text }) { requireText(text, '.tiktokimg enlace'); if (!isUrl(text)) throw new Error('Debes proporcionar un enlace válido.'); await reply(sock, chat, message, `🖼️ Enlace de TikTok recibido:\n${text}\n\nEl extractor de imágenes debe conectarse a un proveedor/API autorizado.`) } }
]
