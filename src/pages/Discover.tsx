import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import TMDBShowModal from '../components/TMDBShowModal'
import { useTMDB, TMDB_IMG } from '../hooks/useTMDB'
import type { TMDBShow } from '../hooks/useTMDB'
import type { Platform, SeriesInsert } from '../types'
import { PLATFORMS } from '../types'

const DISCOVERABLE = PLATFORMS.filter(p => p !== 'Outra')

export default function Discover() {
  const [platform, setPlatform] = useState<Platform>(DISCOVERABLE[0])
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [selectedShow, setSelectedShow] = useState<TMDBShow | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { shows, loading, error, hasMore, loadMore } = useTMDB(platform, query)
  const navigate = useNavigate()

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setQuery(searchInput), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  useEffect(() => {
    setSelectedShow(null)
  }, [query, platform])

  function handleAdd(show: TMDBShow) {
    const prefill: SeriesInsert = {
      title: show.name,
      poster_url: show.poster_path ? `${TMDB_IMG}/w500${show.poster_path}` : null,
      platform,
      status: 'want_to_watch',
      current_season: null,
      current_episode: null,
      rating: null,
      notes: null,
      next_episode_date: null,
      next_episode_season: null,
      next_episode_number: null,
      next_episode_title: null,
    }
    navigate('/series/new', { state: { prefill } })
  }

  const isSearching = query.trim().length > 0

  return (
    <Layout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Descobrir</h1>
          <p className="text-slate-400 text-sm mt-1">
            via{' '}
            <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">
              The Movie Database
            </a>
          </p>
        </div>

        <input
          type="search"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Pesquisar séries..."
          className="input w-full"
        />

        <div className={`flex gap-2 overflow-x-auto pb-1 transition-opacity ${isSearching ? 'opacity-40 pointer-events-none' : ''}`}>
          {DISCOVERABLE.map(p => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`flex-shrink-0 badge py-1.5 px-3 text-sm ${platform === p ? 'bg-brand-700 text-brand-100' : 'bg-slate-800 text-slate-300'}`}
            >
              {p}
            </button>
          ))}
        </div>

        {loading && shows.length === 0 && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
          </div>
        )}

        {error && (
          <div className="card border-red-800 bg-red-950/30 space-y-1">
            <p className="text-red-300 font-medium text-sm">Não foi possível carregar</p>
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        {!error && (shows.length > 0 || !loading) && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">
              {isSearching
                ? <>Resultados para <span className="text-slate-300 font-medium">{query}</span> · pesquisa global</>
                : <>Top <span className="text-slate-300 font-medium">{platform}</span> · disponível em Portugal · ordenado por popularidade</>}
            </p>

            {shows.map((show, i) => (
              <div key={show.id} className="card flex gap-3 items-start">
                <button
                  type="button"
                  onClick={() => setSelectedShow(show)}
                  className="flex flex-1 gap-3 items-start text-left min-w-0"
                >
                  <span className={`flex-shrink-0 w-6 text-center text-sm font-bold tabular-nums mt-5 ${i < 3 ? 'text-brand-400' : 'text-slate-600'}`}>
                    {i + 1}
                  </span>

                  <span className="flex-shrink-0 w-11 h-16 bg-slate-800 rounded-lg overflow-hidden">
                    {show.poster_path ? (
                      <img src={`${TMDB_IMG}/w185${show.poster_path}`} alt={show.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-lg">📺</span>
                    )}
                  </span>

                  <span className="flex-1 min-w-0">
                    <span className="font-medium text-slate-100 truncate text-sm block">{show.name}</span>
                    <span className="flex items-center gap-2 mt-0.5">
                      {show.first_air_date && <span className="text-xs text-slate-500">{show.first_air_date.slice(0, 4)}</span>}
                      {show.vote_average > 0 && <span className="text-xs text-yellow-400">⭐ {show.vote_average.toFixed(1)}</span>}
                    </span>
                    {show.overview && (
                      <>
                        <span className="text-xs text-slate-500 mt-1 line-clamp-2 block">{show.overview}</span>
                        <span className="text-[11px] text-brand-400 mt-1 block">Ver detalhe</span>
                      </>
                    )}
                  </span>
                </button>

                <button onClick={() => handleAdd(show)} className="flex-shrink-0 btn-primary text-sm py-1.5 px-3" title={`Adicionar ${show.name} à lista`}>
                  +
                </button>
              </div>
            ))}

            {shows.length === 0 && !loading && (
              <div className="card text-center py-10">
                <p className="text-slate-400">{isSearching ? `Nenhum resultado para ${query}` : `Nenhum resultado para ${platform}`}</p>
              </div>
            )}

            {hasMore && (
              <button onClick={loadMore} disabled={loading} className="w-full btn-secondary py-2 text-sm mt-2">
                {loading ? 'A carregar...' : 'Carregar mais'}
              </button>
            )}
          </div>
        )}
      </div>

      {selectedShow && (
        <TMDBShowModal show={selectedShow} onClose={() => setSelectedShow(null)} onAdd={handleAdd} />
      )}
    </Layout>
  )
}
