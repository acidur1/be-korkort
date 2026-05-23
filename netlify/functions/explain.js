export default async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI-förklaring inte konfigurerad' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { question, options, correct, selected } = body
  if (!question || !options || !correct) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const prompt = `Du är körkortslärare för BE-behörighet. Förklara kort (3-5 meningar) varför svaret är rätt, på svenska.

Fråga: ${question}
Alternativ: ${options.join(' | ')}
Rätt svar: ${Array.isArray(correct) ? correct.join(', ') : correct}
Användarens svar: ${Array.isArray(selected) ? selected.join(', ') : selected}`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )
    if (!res.ok) {
      const detail = await res.text()
      return new Response(JSON.stringify({ error: 'Provider error', detail }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Network error', detail: String(err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
