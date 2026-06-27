import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { searchTMDBShow } from './useTMDB'
import type { TMDBShow } from './useTMDB'

export interface Recommendation {
  title: string
  reason: string
  show: TMDBShow | null
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Não autenticado')

      const { data: seriesData } = await supabase
        .from('series')
        .select('title, status, rating')
        .eq('user_id', session.user.id)
        .in('status', ['watching', 'completed', 'want_to_watch'])
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(40)

      const { data, error: fnError } = await supabase.functions.invoke('recomendation', {
        body: { series: seriesData ?? [] },
      })
      if (fnError) {
        // Extract the real error message from the function's response body
        const body = await (fnError as { context?: Response }).context?.json?.().catch(() => null)
        throw new Error(body?.error ?? fnError.message)
      }
      if (data?.error) throw new Error(data.error)

      const recs: Recommendation[] = await Promise.all(
        (data as Array<{ title: string; reason: string }>).map(async rec => ({
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
