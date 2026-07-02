import { useEffect, useState } from 'react'
import { resolveTMDBShowDetail, tmdbImage } from '../hooks/useTMDBDetail'
import type { TMDBShowDetail } from '../hooks/useTMDBDetail'

interface Props {
  title: string
  fallbackPosterUrl?: string | null
  tmdbId?: number | null
}

function translateStatus(status?: string) {
  const map: Record<string, string> = {
    ReturningSeries: 'Em exibição',
    'Returning Series': 'Em exibição',
    Ended: 'Terminada',
    Canceled: 'Cancelada',
    Cancelled: 'Cancelada',
    Pilot: 'Piloto',
    Planned: 'Planeada',
  }
  return status ? map[status] ?? status : null
}

function joinOrDash(values?: string[]) {
  return values?.length ? values.join(', ') : '—'
}

export default function TMDBSeriesInfo({ title, fallbackPosterUrl, tmdbId }: Props) {
  const [detail, setDetail] = useState<TMDBShowDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    setLoading(true)

    resolveTMDBShowDetail(title, controller.signal, tmdbId, fallbackPosterUrl)
      .then(data => { if (active) setDetail(data) })
      .catch(() => { if (active) setDetail(null) })
      .finally(() => { if (active) setLoading(false) })

    return () => {
      active = false
      controller.abort()
    }
  }, [title, tmdbId, fallbackPosterUrl])

  if (!loading && !detail && !fallbackPosterUrl) return null

  const posterUrl = tmdbImage(detail?.poster_path, 'w500') ?? fallbackPosterUrl
  const backdropUrl = tmdbImage(detail?.backdrop_path, 'w780')
  const cast = detail?.credits?.cast?.slice(0, 5) ?? []

  return (
    <div className="card space-y-4 overflow-hidden">
      {backdropUrl && (
        <img src={backdropUrl} alt="" className="-mx-4 -mt-4 w-[calc(100%+2rem)] max-w-none h-36 object-cover opacity-80" />
      )}

      {posterUrl && (
        <img src={posterUrl} alt={title} className="w-[72%] max-w-xs max-h-[520px] mx-auto object-contain rounded-xl bg-slate-900" />
      )}

      {loading && <p className="text-sm text-slate-400">A carregar detalhe...</p>}

      {detail && (
        <>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {detail.vote_average > 0 && <p className="text-yellow-400">⭐ {detail.vote_average.toFixed(1)}</p>}
            {detail.first_air_date && <p className="text-slate-300">📅 {detail.first_air_date.slice(0, 4)}</p>}
            <p className="text-slate-300">📺 {translateStatus(detail.status) ?? '—'}</p>
            <p className="text-slate-300">🎬 {detail.number_of_seasons} temp.</p>
            <p className="text-slate-300">🎞️ {detail.number_of_episodes} eps.</p>
            {detail.episode_run_time?.[0] && <p className="text-slate-300">⏱️ {detail.episode_run_time[0]} min</p>}
          </div>

          {detail.genres?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {detail.genres.map(genre => <span key={genre.id} className="badge bg-slate-700 text-slate-300">{genre.name}</span>)}
            </div>
          )}

          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Origem</p>
            <p className="text-sm text-slate-300">{joinOrDash(detail.origin_country)} · {detail.original_language?.toUpperCase()}</p>
          </div>

          {detail.overview && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Sinopse</p>
              <p className="text-slate-300 text-sm whitespace-pre-wrap">{detail.overview}</p>
            </div>
          )}

          {cast.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Elenco principal</p>
              <div className="space-y-2">
                {cast.map(person => (
                  <a
                    key={person.id}
                    href={`https://www.themoviedb.org/person/${person.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:bg-slate-800/50 rounded-lg px-1 -mx-1 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex-shrink-0">
                      {person.profile_path && <img src={tmdbImage(person.profile_path, 'w185') ?? ''} alt={person.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-200 truncate">{person.name}</p>
                      <p className="text-xs text-slate-500 truncate">{person.character}</p>
                    </div>
                    <span className="text-xs text-brand-400 flex-shrink-0">↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <a href={`https://www.themoviedb.org/tv/${detail.id}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-400 hover:underline inline-block">
            Abrir no TMDB
          </a>
        </>
      )}
    </div>
  )
}
