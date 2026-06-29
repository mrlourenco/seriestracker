import { useState, useEffect } from 'react'
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

function saveStored(recs: Recommendation[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(recs)) } catch { /* quota */ }
}

async function fetchOwned(): Promise<Set<string>> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Set()
  const { data } = await supabase
    .from('series')
    .select('title')
    .eq('user_id', user.id)
  return new Set((data ?? []).map(s => s.title.toLowerCase().trim()))
}

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>(loadStored)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Re-filter stored recommendations against the current series list on mount
  useEffect(() => {
    const stored = loadStored()
    if (stored.length === 0) return
    fetchOwned().then(owned => {
      const isOwned = (rec: Recommendation) =>
        owned.has(rec.title.toLowerCase().trim()) ||
        owned.has((rec.show?.name ?? '').toLowerCase().trim())
      const filtered = stored.filter(rec => !isOwned(rec))
      if (filtered.length !== stored.length) {
        setRecommendations(filtered)
        saveStored(filtered)
      }
    }).catch(() => { /* ignore – will be filtered on next generate */ })
  }, [])

  const generate = async (genres?: string[]) => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { data: seriesData } = await supabase
        .from('series')
        .select('title, status, rating')
        .eq('user_id', user.id)
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(60)

      const { data, error: fnError } = await supabase.functions.invoke('recomendation', {
        body: { series: seriesData ?? [], genres: genres?.length ? genres : undefined },
      })
      if (fnError) {
        const body = await (fnError as { context?: Response }).context?.json?.().catch(() => null)
        throw new Error(body?.error ?? fnError.message)
      }
      if (data?.error) throw new Error(data.error)

      const ownedTitles = new Set((seriesData ?? []).map(s => s.title.toLowerCase().trim()))
      const isOwned = (rec: Recommendation) =>
        ownedTitles.has(rec.title.toLowerCase().trim()) ||
        ownedTitles.has((rec.show?.name ?? '').toLowerCase().trim())

      const recs: Recommendation[] = (
        await Promise.all(
          (data as Array<{ title: string; reason: string }>).map(async rec => ({
            title: rec.title,
            reason: rec.reason,
            show: await searchTMDBShow(rec.title).catch(() => null),
          }))
        )
      ).filter(rec => !isOwned(rec))

      setRecommendations(recs)
      saveStored(recs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar recomendações')
    } finally {
      setLoading(false)
    }
  }

  return { recommendations, loading, error, generate }
}
