export async function callMediaProvider({ operation, query = '', url = '', type = 'auto' }) {
  const endpoint = process.env.MEDIA_API_URL
  const apiKey = process.env.MEDIA_API_KEY
  if (!endpoint) return null
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}) },
    body: JSON.stringify({ operation, query, url, type })
  })
  if (!response.ok) throw new Error(`El proveedor multimedia respondió HTTP ${response.status}.`)
  const data = await response.json()
  if (!data.url) throw new Error('El proveedor multimedia no devolvió una URL de resultado.')
  return data
}

export async function callTextProvider(prompt) {
  const endpoint = process.env.AI_API_URL
  const apiKey = process.env.AI_API_KEY
  if (!endpoint) return null
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}) },
    body: JSON.stringify({ prompt })
  })
  if (!response.ok) throw new Error(`El proveedor de IA respondió HTTP ${response.status}.`)
  const data = await response.json()
  return data.text || data.response || data.answer || null
}
