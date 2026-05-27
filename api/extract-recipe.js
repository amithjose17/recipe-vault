export const config = { runtime: 'edge' }

const SYSTEM_PROMPT = `You are a professional chef and recipe extractor. Given an Instagram post URL and optional caption/context, extract or generate a detailed, accurate recipe.

Return ONLY valid JSON in this exact structure:
{
  "title": "Recipe Name",
  "description": "Brief appetising description (1-2 sentences)",
  "cuisine": "Italian / Indian / Mexican / etc",
  "prep_time_mins": 15,
  "cook_time_mins": 30,
  "base_servings": 4,
  "tags": ["vegetarian", "quick", "pasta"],
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": 200,
      "unit": "g",
      "notes": "optional note like 'finely chopped'"
    }
  ],
  "steps": [
    {
      "order": 1,
      "title": "Short step title",
      "instruction": "Full detailed instruction",
      "timer_mins": 10
    }
  ],
  "tips": ["Tip 1", "Tip 2"]
}

Rules:
- Use metric units (g, ml, kg, l) or clear counts (e.g. "2 cloves")
- amount must always be a number (never a string)
- If timer_mins is not applicable, set to null
- base_servings should be realistic (2-6 for home cooking)
- Be specific and detailed in instructions
- If the URL gives limited info, generate the most likely classic version of the dish shown`

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { url, caption } = await req.json()

    if (!url && !caption) {
      return new Response(JSON.stringify({ error: 'URL or caption required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    const userMessage = `Extract the recipe from this Instagram post.
URL: ${url || 'Not provided'}
Caption/Context: ${caption || 'Not provided'}

Return the recipe as JSON.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
      })
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Claude API error: ${err}`)
    }

    const data = await response.json()
    const text = data.content[0].text

    // Strip markdown fences if present
    const clean = text.replace(/```json\n?|\n?```/g, '').trim()
    const recipe = JSON.parse(clean)

    return new Response(JSON.stringify({ recipe }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (err) {
    console.error('Extract recipe error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}
