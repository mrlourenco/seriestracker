import { useEffect, useState } from 'react'
import type { Platform } from '../types'

export interface TMDBShow {
  id: number
  name: string
  poster_path: string | null
  overview: string
  vote_average: number
  first_air_date: string
}

// TMDB watch provider IDs (region PT)
const PROVIDER_IDS: Partial<Record<Platform, number>> = {
  'Netflix': 8,
  'Max': 1899,
  'Disney+': 337,
  'Prime': 119,
  'Apple TV': 350,
}

export const TMDB_IMG = 'https://image.tmdb.org/t/p'

export function useTMDB(platform: Platform) {
  const [shows, setShows] = useState<TMDBShow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const providerId = PROVIDER_IDS[platform]
    if (!providerId) {
      setShows([])
      setLoading(false)
      return
    }

    const apiKey = import.meta.env.VITE_TMDB_API_KEY
    if (!apiKey) {
      setError('Adiciona VITE_TMDB_API_KEY ao ficheiro .env.local para usar esta funcionalidade.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const url =
      `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}` +
      `&with_watch_providers=${providerId}&watch_region=PT` +
      `&sort_by=popularity.desc&page=1&language=pt-PT`

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`Erro TMDB: ${r.status}`)
        return r.json() as Promise<{ results: TMDBShow[] }>
      })
      .then(data => { setShows(data.results ?? []); setLoading(false) })
      .catch((err: Error) => { setError(err.message); setLoading(false) })
  }, [platform])

  return { shows, loading, error }
}
