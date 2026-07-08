export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  }

  try {
    const { prompt, system, messages } = req.body

    // Support two modes:
    // 1. Simple prompt string (for plan generation)
    // 2. Full messages array with optional system prompt (for Ask Erik chat)
    const requestBody = {
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
    }

    if (messages && Array.isArray(messages)) {
      requestBody.messages = messages
      if (system) requestBody.system = system
    } else if (prompt) {
      requestBody.messages = [{ role: 'user', content: prompt }]
    } else {
      return res.status(400).json({ error: 'Either prompt or messages required' })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errText = await response.text()
      return res.status(response.status).json({ error: errText })
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
