import fs from 'node:fs'
import path from 'node:path'

const file = path.resolve('data/store.json')
const initial = { groups: {}, users: {}, disabled: [] }
fs.mkdirSync(path.dirname(file), { recursive: true })
if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(initial, null, 2))
export const store = JSON.parse(fs.readFileSync(file, 'utf8'))
export function saveStore() { fs.writeFileSync(file, JSON.stringify(store, null, 2)) }
export function groupData(jid) { return store.groups[jid] ||= { rules: '', welcome: '', bye: '', muted: false, banned: false } }
