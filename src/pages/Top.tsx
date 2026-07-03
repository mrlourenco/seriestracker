import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Pill from '../components/Pill'
import Spinner from '../components/Spinner'
import { seriesGradient } from '../lib/gradients'
import { useSeries } from '../hooks/useSeries'
import { useAuth } from '../hooks/useAuth'
import { STATUS_LABELS, PLATFORMS } from '../types'
import type { Series, SeriesStatus, Platform } from '../types'
import { resolveTMDBShowDetail } from '../hooks/useTMDBDetail'
import { supabase } from '../lib/supabase'

const STATUS_OPTIONS: { key: SeriesStatus | 'all'; label: string }[] = [
  { key: 'all',          label: 'Todas' },
  { key: 'completed',    label: 'Terminadas' },
  { key: 'watching',     label: 'A ver' },
  { key: 'want_to_watch',label: 'Para ver' },
  { key: 'dropped',      label: 'Abandonadas' },
  { key: 'archived',     label: 'Arquivo' },
]

export default function Top() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<SeriesStatus | 'all'>('all')
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all')
  const [genreFilter, setGenreFilter] = useState<string | 'all'>('all')
  const [extraGenres, setExtraGenres] = useState<Map<string, string[]>>(new Map())
  const backfillStarted = useRef(false)

  const { series, loading } = useSeries({ userId: user?.id ?? null })

  const getGenres = (s: Series): string[] =>
    s.genres?.length ? s.genres : (extraGenres.get(s.id) ?? [])

  useEffect(() => {
    if (loading || backfillStarted.current) return
    const missing = series.filter(s => !s.genres?.length)
    if (!missing.length) return
    backfillStarted.current = true

    const BATCH = 5
    let i = 0
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    async function runBatch() {
      const batch = missing.slice(i, i + BATCH)
      if (!batch.length || cancelled) return
      i += BATCH
      await Promise.all(batch.map(async s => {
        try {
          const detail = await resolveTMDBShowDetail(s.title, undefined, s.tmdb_id, s.poster_url)
          const genres = detail?.genres?.map(g => g.name) ?? []
          if (!genres.length || cancelled) return
          setExtraGenres(prev => new Map(prev).set(s.id, genres))
          await supabase.from('series').update({ genres }).eq('id', s.id)
        } catch { /* silently skip */ }
      }))
      if (!cancelled) timer = setTimeout(runBatch, 300)
    }
    runBatch()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [loading, series])

  const allGenres = Array.from(
    new Set(series.flatMap(s => getGenres(s)))
  ).sort()

  const filtered = series
    .filter(s => statusFilter === 'all' || s.status === statusFilter)
    .filter(s => platformFilter === 'all' || s.platform === platformFilter)
    .filter(s => genreFilter === 'all' || getGenres(s).includes(genreFilter))
    .sort((a, b) => {
      if (a.rating !== null && b.rating !== null) return b.rating - a.rating
      if (a.rating !== null) return -1
      if (b.rating !== null) return 1
      return 0
    })

  const rated   = filtered.filter(s => s.rating !== null)
  const unrated = filtered.filter(s => s.rating === null)

  return (
    <Layout>
      <div style={{ padding: '20px 16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: '6px 14px' }}>
            ← Voltar
          </button>
          <h1 style={{ font: "800 20px 'Hanken Grotesk'", color: '#f3f3f5', margin: 0 }}>Top Séries</h1>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Status filter */}
          <div className="noscroll" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            {STATUS_OPTIONS.map(({ key, label }) => (
              <Pill key={key} active={statusFilter === key} onClick={() => setStatusFilter(key)}>
                {label}
              </Pill>
            ))}
          </div>

          {/* Platform filter */}
          <div className="noscroll" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            <Pill active={platformFilter === 'all'} activeBg="#3f3f46" size="sm" onClick={() => setPlatformFilter('all')}>
              Todas as plataformas
            </Pill>
            {PLATFORMS.map(p => (
              <Pill key={p} active={platformFilter === p} activeBg="#3f3f46" size="sm" onClick={() => setPlatformFilter(p)}>
                {p}
              </Pill>
            ))}
          </div>

          {/* Genre filter */}
          {allGenres.length > 0 && (
            <div className="noscroll" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
              <Pill active={genreFilter === 'all'} activeBg="#1d4ed8" size="sm" onClick={() => setGenreFilter('all')}>
                Todos os géneros
              </Pill>
              {allGenres.map(g => (
                <Pill key={g} active={genreFilter === g} activeBg="#1d4ed8" size="sm" onClick={() => setGenreFilter(g)}>
                  {g}
                </Pill>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ font: "500 15px 'Hanken Grotesk'", color: '#6b6b73' }}>Nenhuma série encontrada</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rated.map((s, i) => {
              const genres = getGenres(s).slice(0, 2)
              const subtitle = [s.platform, genres.length ? genres.join(', ') : STATUS_LABELS[s.status]].filter(Boolean).join(' · ')
              return (
                <Link
                  key={s.id}
                  to={`/series/${s.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 13px', borderRadius: 15, background: '#131318', border: '1px solid #20202a', textDecoration: 'none' }}
                >
                  <span style={{ width: 28, flexShrink: 0, font: "800 15px 'Hanken Grotesk'", color: i < 3 ? '#E11D2A' : '#4a4a55', textAlign: 'center' }}>
                    #{i + 1}
                  </span>
                  <div style={{ flexShrink: 0, width: 42, height: 60, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                    {s.poster_url ? (
                      <img src={s.poster_url} alt={s.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, background: seriesGradient(s.title) }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: "700 14px 'Hanken Grotesk'", color: '#f3f3f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.title}
                    </div>
                    <div style={{ font: "500 12px 'Hanken Grotesk'", color: '#8a8a95', marginTop: 3 }}>
                      {subtitle}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <span style={{ font: "800 18px 'Hanken Grotesk'", color: '#fbbf24', lineHeight: 1 }}>
                      {s.rating}
                    </span>
                    <span style={{ font: "500 10px 'Hanken Grotesk'", color: '#6b6b73' }}>/10</span>
                  </div>
                </Link>
              )
            })}

            {unrated.length > 0 && (
              <>
                {rated.length > 0 && (
                  <p style={{ font: "600 11px 'Hanken Grotesk'", color: '#4a4a55', letterSpacing: '.06em', textTransform: 'uppercase', marginTop: 8 }}>
                    Sem avaliação
                  </p>
                )}
                {unrated.map(s => {
                  const genres = getGenres(s).slice(0, 2)
                  const subtitle = [s.platform, genres.length ? genres.join(', ') : STATUS_LABELS[s.status]].filter(Boolean).join(' · ')
                  return (
                    <Link
                      key={s.id}
                      to={`/series/${s.id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 13px', borderRadius: 15, background: '#131318', border: '1px solid #20202a', textDecoration: 'none', opacity: 0.6 }}
                    >
                      <span style={{ width: 28, flexShrink: 0, font: "600 13px 'Hanken Grotesk'", color: '#4a4a55', textAlign: 'center' }}>—</span>
                      <div style={{ flexShrink: 0, width: 42, height: 60, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                        {s.poster_url ? (
                          <img src={s.poster_url} alt={s.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ position: 'absolute', inset: 0, background: seriesGradient(s.title) }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ font: "700 14px 'Hanken Grotesk'", color: '#f3f3f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.title}
                        </div>
                        <div style={{ font: "500 12px 'Hanken Grotesk'", color: '#8a8a95', marginTop: 3 }}>
                          {subtitle}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
