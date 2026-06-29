import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Spinner from '../components/Spinner'
import TMDBShowModal from '../components/TMDBShowModal'
import { seriesGradient } from '../lib/gradients'
import { useTMDB, useTMDBTrending, TMDB_IMG } from '../hooks/useTMDB'
import { useRecommendations } from '../hooks/useRecommendations'
import { supabase } from '../lib/supabase'
import type { TMDBShow } from '../hooks/useTMDB'
import type { Platform, SeriesInsert } from '../types'
import { PLATFORMS } from '../types'

type Tab = 'browse' | 'trending' | 'foryou'

const DISCOVERABLE = PLATFORMS.filter(p => p !== 'Outra')

const TABS: { id: Tab; label: string }[] = [
  { id: 'browse', label: 'Plataformas' },
  { id: 'trending', label: 'Top Global' },
  { id: 'foryou', label: 'Para ti' },
]

interface ShowCardProps {
  show: TMDBShow
  index?: number
  onSelect: (show: TMDBShow) => void
  onAdd: (show: TMDBShow) => void
  note?: string
  owned?: boolean
}

function ShowCard({ show, index, onSelect, onAdd, note, owned }: ShowCardProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 13px', borderRadius: 15, background: '#131318', border: '1px solid #20202a' }}>
      {index !== undefined && (
        <span style={{ flexShrink: 0, width: 22, textAlign: 'center', font: "700 13px 'Hanken Grotesk'", color: index < 3 ? '#E11D2A' : '#3f3f46' }}>
          {index + 1}
        </span>
      )}
      <button type="button" onClick={() => onSelect(show)} style={{ flexShrink: 0, width: 44, height: 63, borderRadius: 8, overflow: 'hidden', background: '#1e1e26', position: 'relative', border: 'none', padding: 0, cursor: 'pointer' }}>
        {show.poster_path
          ? <img src={`${TMDB_IMG}/w185${show.poster_path}`} alt={show.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ position: 'absolute', inset: 0, background: seriesGradient(show.name) }} />
        }
      </button>
      <button type="button" onClick={() => onSelect(show)} style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        <div style={{ font: "700 14px 'Hanken Grotesk'", color: '#f3f3f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{show.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          {show.first_air_date && <span style={{ font: "500 12px 'Hanken Grotesk'", color: '#6b6b73' }}>{show.first_air_date.slice(0, 4)}</span>}
          {show.vote_average > 0 && <span style={{ font: "600 12px 'Hanken Grotesk'", color: '#fbbf24' }}>★ {show.vote_average.toFixed(1)}</span>}
        </div>
        {note
          ? <p style={{ font: "500 11px/1.4 'Hanken Grotesk'", color: '#a78bfa', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{note}</p>
          : show.overview && <p style={{ font: "500 11px/1.4 'Hanken Grotesk'", color: '#6b6b73', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{show.overview}</p>
        }
        <span style={{ font: "600 11px 'Hanken Grotesk'", color: '#E11D2A', marginTop: 4, display: 'block' }}>Ver detalhe</span>
      </button>
      <button
        type="button"
        onClick={() => !owned && onAdd(show)}
        title={owned ? 'Já na tua lista' : `Adicionar "${show.name}"`}
        style={{
          flexShrink: 0, width: 34, height: 34, borderRadius: 10,
          background: owned ? '#1e1e26' : '#E11D2A',
          color: owned ? '#3f3f46' : '#fff',
          font: "700 18px 'Hanken Grotesk'", lineHeight: 1,
          border: owned ? '1px solid #2a2a32' : 'none',
          cursor: owned ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {owned ? '✓' : '+'}
      </button>
    </div>
  )
}

export default function Discover() {
  const [tab, setTab] = useState<Tab>('browse')
  const [platform, setPlatform] = useState<Platform>(DISCOVERABLE[0])
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [selectedShow, setSelectedShow] = useState<TMDBShow | null>(null)
  const [owned, setOwned] = useState<Map<string, string>>(new Map())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()

  const { shows, loading, error, hasMore, loadMore } = useTMDB(platform, query)
  const trending = useTMDBTrending()
  const recs = useRecommendations()

  const refreshOwned = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error: qErr } = await supabase.from('series').select('id, title').eq('user_id', user.id)
      if (!qErr && data) setOwned(new Map(data.map(s => [s.title.toLowerCase().trim(), s.id])))
    } catch { /* best-effort: ownership indicators simply won't show */ }
  }, [])

  useEffect(() => {
    refreshOwned()
    const onVisible = () => { if (document.visibilityState === 'visible') refreshOwned() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refreshOwned])

  const isOwned = useCallback((name: string) => owned.has(name.toLowerCase().trim()), [owned])
  const ownedId = useCallback((name: string) => owned.get(name.toLowerCase().trim()), [owned])

  const handleRemove = useCallback(async (id: string) => {
    await supabase.from('series').delete().eq('id', id)
    await refreshOwned()
    setSelectedShow(null)
  }, [refreshOwned])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setQuery(searchInput), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  useEffect(() => { setSelectedShow(null) }, [query, platform, tab])

  const isTyping = searchInput !== query
  const isSearching = query.trim().length > 0
  const isBusy = isTyping || loading

  function handleAdd(show: TMDBShow) {
    if (isOwned(show.name)) return
    const prefill: SeriesInsert = {
      title: show.name,
      poster_url: show.poster_path ? `${TMDB_IMG}/w500${show.poster_path}` : null,
      tmdb_id: show.id,
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
            <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" style={{ color: '#E11D2A', textDecoration: 'none' }}>
              The Movie Database
            </a>
          </p>
        </div>

        {/* Tabs */}
        <div className="noscroll" style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flexShrink: 0,
                background: tab === t.id ? '#E11D2A' : '#16161b',
                color: tab === t.id ? '#fff' : '#b4b4bd',
                font: "600 12px 'Hanken Grotesk'",
                padding: '7px 14px', borderRadius: 999,
                border: tab === t.id ? 'none' : '1px solid #26262e',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Plataformas tab ── */}
        {tab === 'browse' && (
          <>
            <div style={{ position: 'relative' }}>
              <input
                type="search"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Pesquisar séries..."
                style={{ width: '100%', boxSizing: 'border-box', background: '#131318', border: '1px solid #26262e', borderRadius: 12, color: '#f3f3f5', font: "500 15px 'Hanken Grotesk'", padding: '12px 40px 12px 14px', outline: 'none' }}
              />
              {isBusy && searchInput.length > 0 && (
                <div style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Spinner size={16} />
                </div>
              )}
            </div>

            <div className="noscroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', opacity: isSearching ? 0.4 : 1, pointerEvents: isSearching ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
              {DISCOVERABLE.map(p => (
                <button key={p} onClick={() => setPlatform(p)} style={{ flexShrink: 0, background: platform === p ? '#E11D2A' : '#16161b', color: platform === p ? '#fff' : '#b4b4bd', font: "600 12px 'Hanken Grotesk'", padding: '7px 14px', borderRadius: 999, border: platform === p ? 'none' : '1px solid #26262e', cursor: 'pointer' }}>
                  {p}
                </button>
              ))}
            </div>

            {loading && shows.length === 0 && <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><Spinner /></div>}
            {error && <ErrorBox message={error} />}

            {!error && (shows.length > 0 || !loading) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                <p style={{ font: "500 12px 'Hanken Grotesk'", color: '#6b6b73' }}>
                  {isSearching
                    ? <>Resultados para <span style={{ color: '#d4d4d8', fontWeight: 600 }}>"{query}"</span> · pesquisa global</>
                    : <>Top <span style={{ color: '#d4d4d8', fontWeight: 600 }}>{platform}</span> · disponível em Portugal · por popularidade</>
                  }
                </p>
                {shows.map((show, i) => <ShowCard key={show.id} show={show} index={i} onSelect={setSelectedShow} onAdd={handleAdd} owned={isOwned(show.name)} />)}
                {shows.length === 0 && !loading && (
                  <div style={{ textAlign: 'center', padding: '48px 0' }}>
                    <p style={{ font: "500 14px 'Hanken Grotesk'", color: '#6b6b73' }}>
                      {isSearching ? `Nenhum resultado para "${query}"` : `Nenhum resultado para ${platform}`}
                    </p>
                  </div>
                )}
                {hasMore && (
                  <button onClick={loadMore} disabled={loading} style={{ width: '100%', background: '#16161b', border: '1px solid #26262e', color: '#b4b4bd', font: "600 13px 'Hanken Grotesk'", padding: '12px', borderRadius: 12, cursor: loading ? 'default' : 'pointer', marginTop: 4, opacity: loading ? 0.5 : 1 }}>
                    {loading ? 'A carregar...' : 'Carregar mais'}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Top Global tab ── */}
        {tab === 'trending' && (
          <>
            {trending.loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><Spinner /></div>}
            {trending.error && <ErrorBox message={trending.error} />}
            {!trending.loading && !trending.error && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ font: "500 12px 'Hanken Grotesk'", color: '#6b6b73' }}>
                  Top <span style={{ color: '#d4d4d8', fontWeight: 600 }}>mundial</span> esta semana · via TMDB
                </p>
                {trending.shows.map((show, i) => <ShowCard key={show.id} show={show} index={i} onSelect={setSelectedShow} onAdd={handleAdd} owned={isOwned(show.name)} />)}
              </div>
            )}
          </>
        )}

        {/* ── Para ti tab ── */}
        {tab === 'foryou' && (
          <>
            {recs.recommendations.length === 0 && !recs.loading && !recs.error && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 0' }}>
                <p style={{ font: "500 14px 'Hanken Grotesk'", color: '#6b6b73', textAlign: 'center' }}>
                  A IA analisa o que viste e os teus ratings para sugerir séries que podes gostar.
                </p>
                <button
                  onClick={recs.generate}
                  style={{ background: '#E11D2A', color: '#fff', font: "700 14px 'Hanken Grotesk'", padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer' }}
                >
                  Gerar recomendações
                </button>
              </div>
            )}

            {recs.recommendations.length === 0 && recs.loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 0' }}>
                <Spinner />
                <p style={{ font: "500 13px 'Hanken Grotesk'", color: '#6b6b73' }}>A analisar as tuas séries...</p>
              </div>
            )}

            {recs.error && <ErrorBox message={recs.error} />}

            {recs.recommendations.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: recs.loading ? 0.5 : 1, transition: 'opacity 0.2s', pointerEvents: recs.loading ? 'none' : 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ font: "500 12px 'Hanken Grotesk'", color: '#6b6b73' }}>
                    {recs.loading
                      ? <span style={{ color: '#a78bfa' }}>A gerar novas recomendações...</span>
                      : <>Recomendado pela <span style={{ color: '#a78bfa', fontWeight: 600 }}>IA</span> com base nos teus gostos</>
                    }
                  </p>
                  <button
                    onClick={recs.generate}
                    disabled={recs.loading}
                    style={{ background: 'none', border: '1px solid #26262e', color: '#b4b4bd', font: "600 11px 'Hanken Grotesk'", padding: '5px 12px', borderRadius: 8, cursor: recs.loading ? 'default' : 'pointer', opacity: recs.loading ? 0.4 : 1 }}
                  >
                    Gerar de novo
                  </button>
                </div>
                {recs.recommendations
                  .filter(rec => !isOwned(rec.show?.name ?? rec.title))
                  .map((rec, i) =>
                    rec.show
                      ? <ShowCard key={i} show={rec.show} onSelect={setSelectedShow} onAdd={handleAdd} note={rec.reason} owned={false} />
                      : (
                        <div key={i} style={{ padding: '12px 16px', borderRadius: 15, background: '#131318', border: '1px solid #20202a' }}>
                          <div style={{ font: "700 14px 'Hanken Grotesk'", color: '#f3f3f5' }}>{rec.title}</div>
                          <div style={{ font: "500 12px 'Hanken Grotesk'", color: '#a78bfa', marginTop: 4 }}>{rec.reason}</div>
                        </div>
                      )
                  )}
              </div>
            )}
          </>
        )}

      </div>

      {selectedShow && (
        <TMDBShowModal
          show={selectedShow}
          onClose={() => setSelectedShow(null)}
          onAdd={handleAdd}
          ownedId={ownedId(selectedShow.name)}
          onRemove={handleRemove}
        />
      )}
    </Layout>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{ background: 'rgba(127,29,29,.25)', border: '1px solid #7f1d1d', borderRadius: 14, padding: '14px 16px' }}>
      <p style={{ font: "600 13px 'Hanken Grotesk'", color: '#fca5a5' }}>Não foi possível carregar</p>
      <p style={{ font: "500 12px 'Hanken Grotesk'", color: '#f87171', marginTop: 4 }}>{message}</p>
    </div>
  )
}
