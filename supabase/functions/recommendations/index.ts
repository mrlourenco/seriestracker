import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { series } = await req.json() as {
      series: Array<{ title: string; status: string; rating: number | null }>
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('GEMINI_API_KEY not set')

    const list = series.length > 0
      ? series.map(s => `- ${s.title}${s.rating != null ? ` (nota ${s.rating}/10)` : ''} [${s.status}]`).join('\n')
      : '(sem séries ainda)'

    const prompt = `És um especialista em séries de televisão. O utilizador tem ou viu estas séries:
${list}

Recomenda 6 séries que este utilizador possa gostar. Considera o rating (nota mais alta = gostou mais) e os géneros implícitos. Se não houver séries suficientes, recomenda séries de grande qualidade.

Responde APENAS com JSON válido, sem markdown nem texto extra:
[{"title":"título original em inglês","reason":"motivo curto em português, 1 frase"}]`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )

    const geminiData = await res.json()
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${JSON.stringify(geminiData)}`)

    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const recs = JSON.parse(cleaned)

    return new Response(JSON.stringify(recs), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
