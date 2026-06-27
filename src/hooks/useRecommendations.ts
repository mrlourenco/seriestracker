import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { searchTMDBShow } from './useTMDB'
import type { TMDBShow } from './useTMDB'

export interface Recommendation {
  title: string
  reason: string
  show: TMDBShow | null
}

async function callGemini(series: Array<{ title: string; status: string; rating: number | null }>): Promise<Array<{ title: string; reason: string }>> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
  if (!apiKey) throw new Error('Adiciona VITE_GEMINI_API_KEY ao ficheiro .env.local para usar esta funcionalidade.')

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
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  )

  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
  return JSON.parse(text)
}

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    setRecommendations([])
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { data: seriesData } = await supabase
        .from('series')
        .select('title, status, rating')
        .eq('user_id', user.id)
        .in('status', ['watching', 'completed', 'want_to_watch'])
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(40)

      const geminiRecs = await callGemini(seriesData ?? [])

      const recs: Recommendation[] = await Promise.all(
        geminiRecs.map(async rec => ({
          title: rec.title,
          reason: rec.reason,
          show: await searchTMDBShow(rec.title).catch(() => null),
        }))
      )

      setRecommendations(recs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar recomendações')
    } finally {
      setLoading(false)
    }
  }

  return { recommendations, loading, error, generate }
}
