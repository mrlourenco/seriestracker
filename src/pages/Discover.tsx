import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useTMDB, TMDB_IMG } from '../hooks/useTMDB'
import type { TMDBShow } from '../hooks/useTMDB'
import type { Platform, SeriesInsert } from '../types'
import { PLATFORMS } from '../types'

const DISCOVERABLE = PLATFORMS.filter(p => p !== 'Outra')

const GRADIENTS = [
  'linear-gradient(150deg,#7f1d1d 0%,#dc2626 100%)',
  'linear-gradient(150deg,#0c4a6e 0%,#0891b2 100%)',
  'linear-gradient(150deg,#082f49 0%,#2563eb 100%)',
  'linear-gradient(150deg,#422006 0%,#d97706 100%)',
  'linear-gradient(150deg,#1e1b4b 0%,#4f46e5 100%)',
  'linear-gradient(150deg,#14532d 0%,#16a34a 100%)',
]
function showGradient(show: TMDBShow) {
  return GRADIENTS[(show.name.charCodeAt(0) ?? 0) % GRADIENTS.length]
}

export default function Discover() {
  const [platform, setPlatform] = useState<Platform>(DISCOVERABLE[0])
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { shows, loading, error, hasMore, loadMore } = useTMDB(platform, query)
  const navigate = useNavigate()

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setQuery(searchInput), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  const isTyping = searchInput !== query
  const isSearching = query.trim().length > 0
  const isBusy = isTyping || loading

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

  return (
    <Layout>
      <div style={{ padding: '20px 16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div>
          <h1 style={{ font: "800 24px/1.1 'Hanken Grotesk'", color: '#f3f3f5', letterSpacing: '-.02em' }}>Descobrir</h1>
          <p style={{ font: "500 13px 'Hanken Grotesk'", color: '#6b6b73', marginTop: 4 }}>
            via{' '}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#E11D2A', textDecoration: 'none' }}
            >
              The Movie Database
            </a>
          </p>
        </div>

        {/* Search input with debounce spinner */}
        <div style={{ position: 'relative' }}>
          <input
            type="search"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Pesquisar séries..."
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#131318', border: '1px solid #26262e', borderRadius: 12,
              color: '#f3f3f5', font: "500 15px 'Hanken Grotesk'",
              padding: '12px 40px 12px 14px', outline: 'none',
            }}
          />
          {isBusy && searchInput.length > 0 && (
            <div style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #E11D2A', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}
        </div>

        {/* Platform pills */}
        <div className="noscroll" style={{
          display: 'flex', gap: 8, overflowX: 'auto',
          opacity: isSearching ? 0.4 : 1,
          pointerEvents: isSearching ? 'none' : 'auto',
          transition: 'opacity 0.2s',
        }}>
          {DISCOVERABLE.map(p => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              style={{
                flexShrink: 0,
                background: platform === p ? '#E11D2A' : '#16161b',
                color: platform === p ? '#fff' : '#b4b4bd',
                font: "600 12px 'Hanken Grotesk'",
                padding: '7px 14px', borderRadius: 999,
                border: platform === p ? 'none' : '1px solid #26262e',
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Full-page spinner — only when no results yet */}
        {loading && shows.length === 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #E11D2A', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(127,29,29,.25)', border: '1px solid #7f1d1d', borderRadius: 14, padding: '14px 16px' }}>
            <p style={{ font: "600 13px 'Hanken Grotesk'", color: '#fca5a5' }}>Não foi possível carregar</p>
            <p style={{ font: "500 12px 'Hanken Grotesk'", color: '#f87171', marginTop: 4 }}>{error}</p>
          </div>
        )}

        {/* Results */}
        {!error && (shows.length > 0 || !loading) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
            <p style={{ font: "500 12px 'Hanken Grotesk'", color: '#6b6b73' }}>
              {isSearching
                ? <>Resultados para <span style={{ color: '#d4d4d8', fontWeight: 600 }}>"{query}"</span> · pesquisa global</>
                : <>Top <span style={{ color: '#d4d4d8', fontWeight: 600 }}>{platform}</span> · disponível em Portugal · por popularidade</>
              }
            </p>

            {shows.map((show, i) => (
              <div
                key={show.id}
                style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 13px', borderRadius: 15, background: '#131318', border: '1px solid #20202a' }}
              >
                <span style={{
                  flexShrink: 0, width: 22, textAlign: 'center',
                  font: "700 13px 'Hanken Grotesk'",
                  color: i < 3 ? '#E11D2A' : '#3f3f46',
                }}>
                  {i + 1}
                </span>

                <div style={{ flexShrink: 0, width: 44, height: 63, borderRadius: 8, overflow: 'hidden', background: '#1e1e26', position: 'relative' }}>
                  {show.poster_path ? (
                    <img
                      src={`${TMDB_IMG}/w185${show.poster_path}`}
                      alt={show.name}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, background: showGradient(show) }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: "700 14px 'Hanken Grotesk'", color: '#f3f3f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {show.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    {show.first_air_date && (
                      <span style={{ font: "500 12px 'Hanken Grotesk'", color: '#6b6b73' }}>{show.first_air_date.slice(0, 4)}</span>
                    )}
                    {show.vote_average > 0 && (
                      <span style={{ font: "600 12px 'Hanken Grotesk'", color: '#fbbf24' }}>★ {show.vote_average.toFixed(1)}</span>
                    )}
                  </div>
                  {show.overview && (
                    <p style={{ font: "500 11px/1.4 'Hanken Grotesk'", color: '#6b6b73', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {show.overview}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleAdd(show)}
                  title={`Adicionar "${show.name}" à lista`}
                  style={{
                    flexShrink: 0, width: 34, height: 34, borderRadius: 10,
                    background: '#E11D2A', color: '#fff',
                    font: "700 20px 'Hanken Grotesk'", lineHeight: 1,
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  +
                </button>
              </div>
            ))}

            {shows.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <p style={{ font: "500 14px 'Hanken Grotesk'", color: '#6b6b73' }}>
                  {isSearching ? `Nenhum resultado para "${query}"` : `Nenhum resultado para ${platform}`}
                </p>
              </div>
            )}

            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loading}
                style={{
                  width: '100%', background: '#16161b', border: '1px solid #26262e',
                  color: '#b4b4bd', font: "600 13px 'Hanken Grotesk'",
                  padding: '12px', borderRadius: 12, cursor: loading ? 'default' : 'pointer',
                  marginTop: 4, opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? 'A carregar...' : 'Carregar mais'}
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
