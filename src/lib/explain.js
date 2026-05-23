export async function fetchExplanation({ question, options, correct, selected }) {
  const res = await fetch('/.netlify/functions/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, options, correct, selected }),
  })
  if (res.status === 503) {
    return { available: false, text: null }
  }
  if (!res.ok) {
    throw new Error(`Förklaring misslyckades (${res.status})`)
  }
  const data = await res.json()
  return { available: true, text: data.text }
}
