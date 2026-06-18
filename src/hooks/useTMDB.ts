import { useEffect, useRef, useState } from 'react'
import type { Platform } from '../types'

export interface TMDBShow {
  id: number
  name: string
  poster_path: string | null
  overview: string
  vote_average: number
  first_air_date: string
}

const PROVIDER_IDS: Partial<Record<Platform, number>> = {
  'Netflix': 8,
  'Max': 1899,
  'Disney+': 337,
  'Prime': 119,
  'Apple TV': 350,
}

export const TMDB_IMG = 'https://image.tmdb.org/t/p'

export function useTMDB(platform: Platform, query = '') {
  const [shows, setShows] = useState<TMDBShow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Stable string key — when it changes, reset accumulated results and page
  const key = `${platform}::${query.trim()}`
  const prevKeyRef = useRef(key)

  useEffect(() => {
    if (prevKeyRef.current !== key) {
      prevKeyRef.current = key
      setPage(1)
      setShows([])
      setTotalPages(1)
    }
  })

  useEffect(() => {
    const apiKey = import.meta.env.VITE_TMDB_API_KEY
    if (!apiKey) {
      setError('Adiciona VITE_TMDB_API_KEY ao ficheiro .env.local para usar esta funcionalidade.')
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    const trimmed = query.trim()
    let url: string
    if (trimmed) {
      url =
        `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}` +
        `&query=${encodeURIComponent(trimmed)}&language=pt-PT&page=${page}`
    } else {
      const providerId = PROVIDER_IDS[platform]
      if (!providerId) { setShows([]); setLoading(false); return }
      url =
        `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}` +
        `&with_watch_providers=${providerId}&watch_region=PT` +
        `&sort_by=popularity.desc&page=${page}&language=pt-PT`
    }

    fetch(url, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`Erro TMDB: ${r.status}`)
        return r.json() as Promise<{ results: TMDBShow[]; total_pages: number }>
      })
      .then(data => {
        setShows(prev => page === 1 ? (data.results ?? []) : [...prev, ...(data.results ?? [])])
        setTotalPages(data.total_pages ?? 1)
        setLoading(false)
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return
        setError(err.message)
        setLoading(false)
      })

    return () => controller.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, page])

  return {
    shows,
    loading,
    error,
    // Pagination only makes sense in browse mode (search returns most relevant first)
    hasMore: !query.trim() && page < totalPages,
    loadMore: () => setPage(p => p + 1),
  }
}
