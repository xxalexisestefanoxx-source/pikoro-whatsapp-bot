import fs from 'node:fs/promises'
import path from 'node:path'

const file = path.resolve('storage/database.json')
const defaults = { users: {}, chats: {}, settings: {} }

export async function loadStore() {
  try {
    const data = JSON.parse(await fs.readFile(file, 'utf8'))
    return { ...defaults, ...data }
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('[store] No se pudo leer la base:', error.message)
    await saveStore(defaults)
    return structuredClone(defaults)
  }
}

export async function saveStore(data) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(data, null, 2))
}
