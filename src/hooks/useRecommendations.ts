import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { searchTMDBShow } from './useTMDB'
import type { TMDBShow } from './useTMDB'

export interface Recommendation {
  title: string
  reason: string
  show: TMDBShow | null
}

const STORAGE_KEY = 'seriestracker_recommendations'

function loadStored(): Recommendation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Recommendation[]) : []
  } catch {
    return []
  }
}

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>(loadStored)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Não autenticado')

      const { data: seriesData } = await supabase
        .from('series')
        .select('title, status, rating')
        .eq('user_id', session.user.id)
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(60)

      const { data, error: fnError } = await supabase.functions.invoke('recomendation', {
        body: { series: seriesData ?? [] },
      })
      if (fnError) {
        const body = await (fnError as { context?: Response }).context?.json?.().catch(() => null)
        throw new Error(body?.error ?? fnError.message)
      }
      if (data?.error) throw new Error(data.error)

      const owned = new Set((seriesData ?? []).map(s => s.title.toLowerCase().trim()))

      const recs: Recommendation[] = (
        await Promise.all(
          (data as Array<{ title: string; reason: string }>).map(async rec => ({
            title: rec.title,
            reason: rec.reason,
            show: await searchTMDBShow(rec.title).catch(() => null),
          }))
        )
      ).filter(rec => !owned.has(rec.title.toLowerCase().trim()))

      setRecommendations(recs)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(recs)) } catch { /* quota */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar recomendações')
    } finally {
      setLoading(false)
    }
  }

  return { recommendations, loading, error, generate }
}
