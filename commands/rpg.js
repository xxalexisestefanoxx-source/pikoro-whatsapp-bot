function reply(sock, chat, message, text) {
  return sock.sendMessage(chat, { text }, { quoted: message })
}

function user(context) {
  const id = context.sender || context.chat
  const value = context.store.users[id] ||= { registered: true, name: 'Aventurero', level: 1, coins: 100, exp: 0, inventory: [] }
  value.level ||= 1; value.coins ||= 0; value.exp ||= 0; value.inventory ||= []
  return value
}

function needRegistration(value) {
  if (!value.registered) throw new Error('Primero usa .reg nombre.edad')
}

export const commands = [
  { name: 'claim', aliases: ['c'], async execute(context) { const value = user(context); needRegistration(value); const now = Date.now(); if (value.lastClaim && now - value.lastClaim < 86_400_000) throw new Error('Ya reclamaste tu recompensa diaria.'); value.lastClaim = now; value.coins += 100; await reply(context.sock, context.chat, context.message, '💼 Recompensa diaria: +100 monedas.') } },
  { name: 'crimen', async execute(context) { const value = user(context); needRegistration(value); const success = Math.random() > 0.35; const amount = 40 + Math.floor(Math.random() * 161); value.coins = Math.max(0, value.coins + (success ? amount : -amount)); await reply(context.sock, context.chat, context.message, success ? `💼 Crimen exitoso: +${amount} monedas.` : `🚔 Fallaste y perdiste ${amount} monedas.`) } },
  { name: 'levelup', async execute(context) { const value = user(context); needRegistration(value); const needed = value.level * 100; if (value.exp < needed) throw new Error(`Necesitas ${needed - value.exp} XP más.`); value.exp -= needed; value.level += 1; await reply(context.sock, context.chat, context.message, `⚡ Subiste al nivel ${value.level}.`) } },
  { name: 'minar', async execute(context) { const value = user(context); needRegistration(value); const amount = 10 + Math.floor(Math.random() * 41); value.coins += amount; value.exp += 10; await reply(context.sock, context.chat, context.message, `⛏️ Minaste +${amount} monedas y +10 XP.`) } },
  { name: 'tienda', async execute({ sock, chat, message }) { await reply(sock, chat, message, '🛒 Tienda:\n1. poción — 50 monedas\n2. escudo — 120 monedas\nUsa .comprar poción o .comprar escudo') } },
  { name: 'comprar', async execute(context) { const value = user(context); needRegistration(value); const item = context.text.toLowerCase(); const prices = { 'poción': 50, pocion: 50, escudo: 120 }; if (!prices[item]) throw new Error('Artículo no válido. Usa .tienda'); if (value.coins < prices[item]) throw new Error('No tienes suficientes monedas.'); value.coins -= prices[item]; value.inventory.push(item); await reply(context.sock, context.chat, context.message, `🫘 Compraste ${item}.`) } },
  { name: 'buy', aliases: ['Buy'], async execute(context) { context.text = context.text || 'poción'; const command = { ...context, text: context.text }; const value = user(command); if (value.coins < 50) throw new Error('No tienes suficientes monedas.'); value.coins -= 50; value.inventory.push('poción'); await reply(context.sock, context.chat, context.message, '🛍️ Compraste una poción.') } },
  { name: 'buyall', aliases: ['Buyall'], async execute(context) { const value = user(context); const affordable = Math.floor(value.coins / 50); if (!affordable) throw new Error('No tienes monedas para comprar.'); value.coins -= affordable * 50; value.inventory.push(...Array.from({ length: affordable }, () => 'poción')); await reply(context.sock, context.chat, context.message, `🛍️ Compraste ${affordable} poción(es).`) } },
  { name: 'work', async execute(context) { const value = user(context); needRegistration(value); const amount = 20 + Math.floor(Math.random() * 81); value.coins += amount; value.exp += 5; await reply(context.sock, context.chat, context.message, `💼 Trabajaste y ganaste ${amount} monedas y 5 XP.`) } }
]
