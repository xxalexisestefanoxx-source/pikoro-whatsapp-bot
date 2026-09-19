function reply(sock, chat, message, text) {
  return sock.sendMessage(chat, { text }, { quoted: message })
}

function target(message, args) {
  return message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || message.message?.extendedTextMessage?.contextInfo?.participant || args[0] || 'alguien'
}

const reactions = {
  abrazar: '🤗 le dio un abrazo a',
  acariciar: '🐾 acarició a',
  besar: '💋 le dio un beso amistoso a',
  dance: '💃 bailó con',
  triste: '😭 está triste junto a',
  love: '❤️ siente cariño por'
}

const neutralDisabled = new Set(['pajero', 'pajera', 'puto', 'puta', 'prostituta', 'prostituto', 'cachuda', 'cachudo', 'negra', 'negro', 'adoptado', 'adoptada', 'sintetas', 'sinpoto', 'sinpito', 'penetrar', 'follar', 'violar'])

export const commands = [
  ...Object.entries(reactions).map(([name, phrase]) => ({ name, async execute({ sock, chat, message, args }) { await reply(sock, chat, message, `${phrase} @${target(message, args).split('@')[0]}.`,) } })),
  { name: 'acertijo', async execute({ sock, chat, message }) { const riddles = ['Tengo agujas y no sé coser. ¿Qué soy? Un reloj.', 'Vuelo sin alas y lloro sin ojos. ¿Qué soy? Una nube.', 'Cuanto más quitas, más grande se vuelve. ¿Qué es? Un agujero.']; await reply(sock, chat, message, `❓ ${riddles[Math.floor(Math.random() * riddles.length)]}`) } },
  { name: 'dado', async execute({ sock, chat, message }) { await reply(sock, chat, message, `🎲 Resultado: ${1 + Math.floor(Math.random() * 6)}`) } },
  { name: 'advpeli', async execute({ sock, chat, message }) { await reply(sock, chat, message, '🎬 Recomendación: elige una película que no hayas visto y comparte tu valoración con el grupo.') } },
  { name: 'minovia', async execute({ sock, chat, message, args }) { await reply(sock, chat, message, `😍 Compatibilidad amistosa: ${20 + Math.floor(Math.random() * 81)}% con @${target(message, args).split('@')[0]}`) } },
  { name: 'minovio', async execute({ sock, chat, message, args }) { await reply(sock, chat, message, `😍 Compatibilidad amistosa: ${20 + Math.floor(Math.random() * 81)}% con @${target(message, args).split('@')[0]}`) } },
  { name: 'gay', async execute({ sock, chat, message, args }) { await reply(sock, chat, message, `🌈 Nivel de orgullo: ${Math.floor(Math.random() * 101)}% para @${target(message, args).split('@')[0]}`) } },
  { name: 'lesbiana', async execute({ sock, chat, message, args }) { await reply(sock, chat, message, `🌈 Resultado de juego: ${Math.floor(Math.random() * 101)}% para @${target(message, args).split('@')[0]}`) } },
  { name: 'peruano', async execute({ sock, chat, message, args }) { await reply(sock, chat, message, `🇵🇪 Resultado de juego: ${Math.floor(Math.random() * 101)}% para @${target(message, args).split('@')[0]}`) } },
  { name: 'peruana', async execute({ sock, chat, message, args }) { await reply(sock, chat, message, `🇵🇪 Resultado de juego: ${Math.floor(Math.random() * 101)}% para @${target(message, args).split('@')[0]}`) } },
  { name: 'manco', async execute({ sock, chat, message, args }) { await reply(sock, chat, message, `🤕 Puntuación humorística: ${Math.floor(Math.random() * 101)}% para @${target(message, args).split('@')[0]}`) } },
  { name: 'manca', async execute({ sock, chat, message, args }) { await reply(sock, chat, message, `🤕 Puntuación humorística: ${Math.floor(Math.random() * 101)}% para @${target(message, args).split('@')[0]}`) } },
  { name: 'rata', async execute({ sock, chat, message, args }) { await reply(sock, chat, message, `🐀 Índice de travesura: ${Math.floor(Math.random() * 101)}% para @${target(message, args).split('@')[0]}`) } },
  { name: 'feo', async execute({ sock, chat, message, args }) { await reply(sock, chat, message, `😬 Resultado de juego: ${Math.floor(Math.random() * 101)}% para @${target(message, args).split('@')[0]}`) } },
  { name: 'fea', async execute({ sock, chat, message, args }) { await reply(sock, chat, message, `😬 Resultado de juego: ${Math.floor(Math.random() * 101)}% para @${target(message, args).split('@')[0]}`) } },
  { name: 'nombreninja', async execute({ sock, chat, message, text }) { if (!text) throw new Error('Uso: .nombreninja texto'); await reply(sock, chat, message, `🥷 Nombre ninja: Kage-${text.replace(/\s+/g, '-')}`) } },
  { name: 'consejo', async execute({ sock, chat, message }) { await reply(sock, chat, message, '💡 Consejo: respeta a los demás y verifica los enlaces antes de abrirlos.') } },
  { name: 'formarpareja', async execute({ sock, chat, message }) { await reply(sock, chat, message, '❤️ Para formar una pareja, etiqueta a dos participantes con consentimiento.') } },
  { name: 'iqtest', async execute({ sock, chat, message }) { await reply(sock, chat, message, `🧠 Resultado recreativo: ${70 + Math.floor(Math.random() * 61)} puntos. No es una medición científica.`) } },
  { name: 'personalidad', async execute({ sock, chat, message, text }) { await reply(sock, chat, message, `🔮 Perfil recreativo de ${text || 'la persona'}: creativo, curioso y único.`) } },
  { name: 'piropo', async execute({ sock, chat, message }) { await reply(sock, chat, message, '💌 Piropo: tu buena actitud mejora el ambiente del grupo.') } },
  { name: 'poema', async execute({ sock, chat, message }) { await reply(sock, chat, message, '❤️ Un mensaje amable puede cambiar el día; compártelo con respeto.') } },
  { name: 'pregunta', async execute({ sock, chat, message }) { await reply(sock, chat, message, '❓ ¿Qué proyecto te gustaría terminar esta semana?') } },
  { name: 'reto', async execute({ sock, chat, message }) { await reply(sock, chat, message, '🎲 Reto: comparte algo útil que hayas aprendido hoy.') } },
  { name: 'ship', async execute({ sock, chat, message, args }) { await reply(sock, chat, message, `👫 Compatibilidad recreativa: ${Math.floor(Math.random() * 101)}% ${args.join(' ')}`) } },
  { name: 'ship5', async execute({ sock, chat, message }) { await reply(sock, chat, message, '👫 Top 5 recreativo: participa solo con el consentimiento de las personas mencionadas.') } },
  { name: 'slot', async execute({ sock, chat, message, args }) { const icons = ['🍒', '🍋', '⭐', '7️⃣']; const result = Array.from({ length: 3 }, () => icons[Math.floor(Math.random() * icons.length)]); await reply(sock, chat, message, `🎰 ${result.join(' | ')}\nApuesta recreativa: ${args[0] || 'sin apuesta'}`) } },
  { name: 'top', async execute({ sock, chat, message, text }) { await reply(sock, chat, message, `🔝 Ranking recreativo sobre: ${text || 'el grupo'}`) } },
  ...[...neutralDisabled, 'horny'].map((name) => ({ name, async execute({ sock, chat, message }) { await reply(sock, chat, message, '⚠️ Este comando está deshabilitado por seguridad y respeto entre participantes.') } }))
]
