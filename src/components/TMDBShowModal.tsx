import { useEffect, useState } from 'react'
import type { TMDBShow } from '../hooks/useTMDB'
import { fetchTMDBShowDetail, tmdbImage } from '../hooks/useTMDBDetail'
import type { TMDBShowDetail } from '../hooks/useTMDBDetail'

interface Props {
  show: TMDBShow
  onClose: () => void
  onAdd: (show: TMDBShow) => void
  owned?: boolean
}

function translateStatus(status?: string) {
  const map: Record<string, string> = {
    'Returning Series': 'Em exibição',
    Ended: 'Terminada',
    Canceled: 'Cancelada',
    Cancelled: 'Cancelada',
    Pilot: 'Piloto',
    Planned: 'Planeada',
  }
  return status ? map[status] ?? status : null
}

export default function TMDBShowModal({ show, onClose, onAdd, owned }: Props) {
  const [detail, setDetail] = useState<TMDBShowDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    setLoading(true)

    fetchTMDBShowDetail(show.id, controller.signal)
      .then(data => { if (active) setDetail(data) })
      .catch(() => { if (active) setDetail(null) })
      .finally(() => { if (active) setLoading(false) })

    return () => {
      active = false
      controller.abort()
    }
  }, [show.id])

  const data = detail ?? show
  const backdropUrl = tmdbImage(detail?.backdrop_path, 'w780')
  const posterUrl = tmdbImage(data.poster_path, 'w500')
  const cast = detail?.credits?.cast?.slice(0, 5) ?? []

  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {backdropUrl && (
          <img src={backdropUrl} alt="" className="-mx-4 -mt-4 w-[calc(100%+2rem)] max-w-none h-36 object-cover opacity-80" />
        )}

        <div className="flex justify-between items-start gap-3">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Detalhe</p>
            <h2 className="text-xl font-bold text-slate-100">{show.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary px-3 py-1">Fechar</button>
        </div>

        {posterUrl && (
          <img src={posterUrl} alt={show.name} className="w-[72%] max-w-xs max-h-[520px] mx-auto object-contain rounded-xl bg-slate-900" />
        )}

        {loading && <p className="text-sm text-slate-400">A carregar detalhe...</p>}

        <div className="grid grid-cols-2 gap-2 text-sm">
          {data.vote_average > 0 && <p className="text-yellow-400">⭐ {data.vote_average.toFixed(1)}</p>}
          {data.first_air_date && <p className="text-slate-300">📅 {data.first_air_date.slice(0, 4)}</p>}
          {detail?.status && <p className="text-slate-300">📺 {translateStatus(detail.status)}</p>}
          {detail && <p className="text-slate-300">🎬 {detail.number_of_seasons} temp.</p>}
          {detail && <p className="text-slate-300">🎞️ {detail.number_of_episodes} eps.</p>}
          {detail?.episode_run_time?.[0] && <p className="text-slate-300">⏱️ {detail.episode_run_time[0]} min</p>}
        </div>

        {detail?.genres?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {detail.genres.map(genre => <span key={genre.id} className="badge bg-slate-700 text-slate-300">{genre.name}</span>)}
          </div>
        ) : null}

        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Sinopse</p>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">
            {data.overview || 'Sem sinopse disponível em português.'}
          </p>
        </div>

        {cast.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Elenco principal</p>
            <div className="space-y-2">
              {cast.map(person => (
                <div key={person.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex-shrink-0">
                    {person.profile_path && <img src={tmdbImage(person.profile_path, 'w185') ?? ''} alt={person.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 truncate">{person.name}</p>
                    <p className="text-xs text-slate-500 truncate">{person.character}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <a href={`https://www.themoviedb.org/tv/${show.id}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-400 hover:underline inline-block">
          Abrir no TMDB
        </a>

        {owned
          ? (
            <button type="button" disabled style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#1e1e26', border: '1px solid #2a2a32', color: '#6b6b73', font: "600 14px 'Hanken Grotesk'", cursor: 'default' }}>
              ✓ Na lista
            </button>
          ) : (
            <button type="button" onClick={() => onAdd(show)} className="btn-primary w-full">
              Adicionar à lista
            </button>
          )
        }
      </div>
    </div>
  )
}
