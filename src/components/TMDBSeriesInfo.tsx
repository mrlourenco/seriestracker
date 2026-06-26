import { useEffect, useState } from 'react'
import { searchTMDBShow, TMDB_IMG } from '../hooks/useTMDB'
import type { TMDBShow } from '../hooks/useTMDB'

interface Props {
  title: string
  fallbackPosterUrl?: string | null
}

export default function TMDBSeriesInfo({ title, fallbackPosterUrl }: Props) {
  const [show, setShow] = useState<TMDBShow | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    setLoading(true)

    searchTMDBShow(title, controller.signal, fallbackPosterUrl)
      .then(data => {
        if (active) setShow(data)
      })
      .catch(() => {
        if (active) setShow(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [title, fallbackPosterUrl])

  if (!loading && !show && !fallbackPosterUrl) return null

  const posterUrl = show?.poster_path ? `${TMDB_IMG}/w500${show.poster_path}` : fallbackPosterUrl

  return (
    <div className="card space-y-4">
      {posterUrl && (
        <img
          src={posterUrl}
          alt={title}
          className="w-[72%] max-w-xs max-h-[520px] mx-auto object-contain rounded-xl bg-slate-900"
        />
      )}

      {show && (
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          {show.first_air_date && <span className="text-slate-400">{show.first_air_date.slice(0, 4)}</span>}
          {show.vote_average > 0 && <span className="text-yellow-400">⭐ {show.vote_average.toFixed(1)}</span>}
          <a
            href={`https://www.themoviedb.org/tv/${show.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-400 hover:underline"
          >
            Abrir no TMDB
          </a>
        </div>
      )}

      {(loading || show?.overview) && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Sinopse</p>
          <p className="text-slate-300 text-sm whitespace-pre-wrap">
            {loading ? 'A carregar sinopse...' : show?.overview}
          </p>
        </div>
      )}
    </div>
  )
}
