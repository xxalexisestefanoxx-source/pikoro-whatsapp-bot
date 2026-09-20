import fs from 'node:fs/promises'
import path from 'node:path'

const file = path.resolve('storage/database.json')
const defaults = { users: {}, chats: {}, settings: {} }

function normalize(data = {}) {
  return {
    ...structuredClone(defaults),
    ...data,
    users: data.users && typeof data.users === 'object' ? data.users : {},
    chats: data.chats && typeof data.chats === 'object' ? data.chats : {},
    settings: data.settings && typeof data.settings === 'object' ? data.settings : {}
  }
}

export function getChat(data, jid) {
  data.chats ||= {}
  data.chats[jid] ||= {
    rules: '',
    welcome: '',
    welcomeEnabled: false,
    bye: '',
    byeEnabled: false,
    antilink: false,
    antispam: false,
    antiflood: false,
    antibot: false,
    antimention: false,
    warnings: {},
    bannedUsers: [],
    mutedUsers: [],
    activity: {}
  }
  return data.chats[jid]
}

export async function loadStore() {
  try {
    const data = JSON.parse(await fs.readFile(file, 'utf8'))
    return normalize(data)
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('[store] No se pudo leer la base:', error.message)
    const fresh = structuredClone(defaults)
    await saveStore(fresh)
    return fresh
  }
}

export async function saveStore(data) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  const temporary = `${file}.tmp`
  await fs.writeFile(temporary, JSON.stringify(data, null, 2))
  await fs.rename(temporary, file)
}

export { file }
