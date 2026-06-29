import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { series, genres } = await req.json() as {
      series: Array<{ title: string; status: string; rating: number | null }>
      genres?: string[]
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('GEMINI_API_KEY not set')

    const list = series.length > 0
      ? series.map(s => `- ${s.title}${s.rating != null ? ` (nota ${s.rating}/10)` : ''} [${s.status}]`).join('\n')
      : '(sem séries ainda)'

    const genreConstraint = genres?.length
      ? `- O utilizador quer especificamente séries do(s) género(s): ${genres.join(', ')}. TODAS as recomendações devem pertencer a pelo menos um desses géneros.`
      : '- Usa o rating (nota mais alta = gostou mais) e os géneros implícitos para inferir os gostos do utilizador.'

    const prompt = `És um especialista em séries de televisão. O utilizador tem estas séries na sua lista:
${list}

Recomenda 6 séries NOVAS que este utilizador possa gostar. Regras obrigatórias:
- NÃO recomandes nenhuma série que já esteja na lista acima, independentemente do status.
${genreConstraint}
- Se não houver séries suficientes para inferir gostos, recomenda séries de grande qualidade reconhecidas.

Responde APENAS com JSON válido, sem markdown nem texto extra:
[{"title":"título original em inglês","reason":"motivo curto em português, 1 frase"}]`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
        }),
      }
    )

    const geminiData = await res.json()
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${JSON.stringify(geminiData)}`)

    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const recs = JSON.parse(cleaned)

    const owned = new Set(series.map((s: { title: string }) => s.title.toLowerCase().trim()))
    const filtered = recs.filter((r: { title: string }) => !owned.has(r.title.toLowerCase().trim()))

    return new Response(JSON.stringify(filtered), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
