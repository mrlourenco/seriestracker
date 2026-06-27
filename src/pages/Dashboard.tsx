import { useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import UpcomingEpisodes from '../components/UpcomingEpisodes'
import { useSeries } from '../hooks/useSeries'
import { useShares } from '../hooks/useShares'
import { useAuth } from '../hooks/useAuth'
import type { Series, SeriesStatus } from '../types'

const GRADIENTS = [
  'linear-gradient(150deg,#7f1d1d 0%,#dc2626 100%)',
  'linear-gradient(150deg,#0c4a6e 0%,#0891b2 100%)',
  'linear-gradient(150deg,#082f49 0%,#2563eb 100%)',
  'linear-gradient(150deg,#422006 0%,#d97706 100%)',
  'linear-gradient(150deg,#1e1b4b 0%,#4f46e5 100%)',
  'linear-gradient(150deg,#14532d 0%,#16a34a 100%)',
  'linear-gradient(150deg,#4a044e 0%,#c026d3 100%)',
  'linear-gradient(150deg,#18181b 0%,#52525b 100%)',
]

function seriesGradient(s: Series) {
  return GRADIENTS[(s.title.charCodeAt(0) ?? 0) % GRADIENTS.length]
}

function seasonEpLabel(s: Series) {
  if (!s.current_season && !s.current_episode) return null
  const parts = []
  if (s.current_season) parts.push(`T${s.current_season}`)
  if (s.current_episode) parts.push(`E${s.current_episode}`)
  return parts.join(' · ')
}

const STATUS_DOT: Record<SeriesStatus, string> = {
  watching:      '#34d399',
  want_to_watch: '#fbbf24',
  completed:     '#60a5fa',
  dropped:       '#f87171',
  archived:      '#71717a',
}

const PILLS: { key: SeriesStatus; label: string }[] = [
  { key: 'watching',      label: 'A ver' },
  { key: 'want_to_watch', label: 'Para ver' },
  { key: 'completed',     label: 'Terminadas' },
  { key: 'archived',      label: 'Arquivo' },
]

type ViewMode = string

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const { sharedWithMe } = useShares()
  const [filter, setFilter] = useState<SeriesStatus>('watching')
  const [viewMode, setViewMode] = useState<ViewMode>('own')

  const isAllMode = viewMode === 'all'
  const isOwnDashboard = viewMode === 'own'

  const allUserIds = [
    ...(user?.id ? [user.id] : []),
    ...sharedWithMe.map(s => s.owner_id),
  ]

  const { series, loading } = useSeries(
    isAllMode
      ? { userIds: authLoading ? [] : allUserIds }
      : { userId: authLoading ? null : (isOwnDashboard ? (user?.id ?? null) : viewMode) }
  )

  const watching     = series.filter(s => s.status === 'watching')
  const filteredList = series.filter(s => s.status === filter)
  const hero         = watching[0] ?? null

  return (
    <Layout>
      {/* Shares view switcher */}
      {sharedWithMe.length > 0 && (
        <div className="noscroll" style={{ display: 'flex', gap: 8, padding: '14px 18px 0', overflowX: 'auto' }}>
          <button
            onClick={() => setViewMode('own')}
            style={{
              flexShrink: 0,
              background: isOwnDashboard ? '#E11D2A' : '#16161b',
              color: isOwnDashboard ? '#fff' : '#b4b4bd',
              font: "600 12px 'Hanken Grotesk'",
              padding: '6px 13px', borderRadius: 999,
              border: isOwnDashboard ? 'none' : '1px solid #26262e',
              cursor: 'pointer',
            }}
          >
            O meu
          </button>
          <button
            onClick={() => setViewMode('all')}
            style={{
              flexShrink: 0,
              background: isAllMode ? '#E11D2A' : '#16161b',
              color: isAllMode ? '#fff' : '#b4b4bd',
              font: "600 12px 'Hanken Grotesk'",
              padding: '6px 13px', borderRadius: 999,
              border: isAllMode ? 'none' : '1px solid #26262e',
              cursor: 'pointer',
            }}
          >
            Todos
          </button>
          {sharedWithMe.map(s => (
            <button
              key={s.id}
              onClick={() => setViewMode(s.owner_id)}
              style={{
                flexShrink: 0,
                background: viewMode === s.owner_id ? '#E11D2A' : '#16161b',
                color: viewMode === s.owner_id ? '#fff' : '#b4b4bd',
                font: "600 12px 'Hanken Grotesk'",
                padding: '6px 13px', borderRadius: 999,
                border: viewMode === s.owner_id ? 'none' : '1px solid #26262e',
                cursor: 'pointer',
              }}
            >
              {s.owner.display_name ?? s.owner.email?.split('@')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Filter pills */}
      <div className="noscroll" style={{ display: 'flex', gap: 8, padding: '16px 18px 4px', overflowX: 'auto' }}>
        {PILLS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              flexShrink: 0,
              background: filter === key ? '#E11D2A' : '#16161b',
              color:      filter === key ? '#fff'    : '#b4b4bd',
              font: "600 13px 'Hanken Grotesk'",
              padding: '8px 15px',
              borderRadius: 999,
              border: filter === key ? 'none' : '1px solid #26262e',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #E11D2A', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <>
          {/* HERO */}
          {filter === 'watching' && hero && (
            <Link to={`/series/${hero.id}`} style={{ display: 'block', margin: '14px 16px 0', position: 'relative', borderRadius: 20, overflow: 'hidden', height: 340, textDecoration: 'none' }}>
              {hero.poster_url ? (
                <img
                  src={hero.poster_url}
                  alt={hero.title}
                  fetchPriority="high"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: seriesGradient(hero) }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(130% 90% at 72% 18%, rgba(255,255,255,.20), transparent 58%)' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,11,14,.97) 7%, rgba(11,11,14,.25) 48%, transparent 72%)' }} />
              <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(0,0,0,.42)', padding: '6px 11px', borderRadius: 999 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                <span style={{ font: "700 11px 'Hanken Grotesk'", color: '#e7e7ea', letterSpacing: '.06em' }}>A VER AGORA</span>
              </div>
              <div style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
                {hero.platform && (
                  <div style={{ font: "600 11px 'Hanken Grotesk'", color: '#cfcfd6', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                    {hero.platform}
                  </div>
                )}
                <div style={{ font: "800 31px/1.04 'Hanken Grotesk'", color: '#fff', letterSpacing: '-.025em', marginTop: 7 }}>
                  {hero.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 11 }}>
                  {hero.platform && (
                    <span style={{ background: 'rgba(255,255,255,.14)', color: '#e7e7ea', font: "600 11px 'Hanken Grotesk'", padding: '4px 9px', borderRadius: 6 }}>
                      {hero.platform}
                    </span>
                  )}
                  {seasonEpLabel(hero) && (
                    <span style={{ font: "600 13px 'Hanken Grotesk'", color: '#d7d7dd' }}>
                      {seasonEpLabel(hero)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )}

          {/* HORIZONTAL RAIL */}
          {filter === 'watching' && watching.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 18px' }}>
                <span style={{ font: "700 16px 'Hanken Grotesk'", color: '#f3f3f5' }}>Continuar a ver</span>
                <Link to="/series?status=watching" style={{ font: "600 12px 'Hanken Grotesk'", color: '#E11D2A', textDecoration: 'none' }}>Ver tudo</Link>
              </div>
              <div className="noscroll" style={{ display: 'flex', gap: 12, padding: '13px 18px 20px', overflowX: 'auto' }}>
                {watching.map(s => (
                  <Link key={s.id} to={`/series/${s.id}`} style={{ flexShrink: 0, width: 118, textDecoration: 'none' }}>
                    <div style={{ position: 'relative', width: 118, height: 177, borderRadius: 12, overflow: 'hidden' }}>
                      {s.poster_url ? (
                        <img src={s.poster_url} alt={s.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, background: seriesGradient(s) }} />
                      )}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.85) 4%, transparent 46%)' }} />
                      <div style={{ position: 'absolute', left: 9, right: 9, bottom: 10, font: "700 13px/1.1 'Hanken Grotesk'", color: '#fff' }}>
                        {s.title}
                      </div>
                    </div>
                    <div style={{ marginTop: 8, font: "500 11px 'Hanken Grotesk'", color: '#8a8a95' }}>
                      {seasonEpLabel(s)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* UPCOMING EPISODES */}
          {filter === 'watching' && watching.length > 0 && (
            <UpcomingEpisodes series={watching} />
          )}

          {/* EMPTY STATE – watching */}
          {filter === 'watching' && watching.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 20px' }}>
              <p style={{ font: "500 15px 'Hanken Grotesk'", color: '#6b6b73', marginBottom: 16 }}>Nenhuma série a ver agora</p>
              <Link
                to="/series/new"
                style={{ display: 'inline-block', background: '#E11D2A', color: '#fff', font: "700 14px 'Hanken Grotesk'", padding: '10px 22px', borderRadius: 13, textDecoration: 'none' }}
              >
                Adicionar série
              </Link>
            </div>
          )}

          {/* LIST VIEW */}
          {filter !== 'watching' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 16px 20px' }}>
              {filteredList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <p style={{ font: "500 14px 'Hanken Grotesk'", color: '#6b6b73' }}>Nenhuma série aqui</p>
                </div>
              ) : filteredList.map(s => (
                <Link
                  key={s.id}
                  to={`/series/${s.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 13px', borderRadius: 15, background: '#131318', border: '1px solid #20202a', textDecoration: 'none' }}
                >
                  <div style={{ flexShrink: 0, width: 42, height: 60, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                    {s.poster_url ? (
                      <img src={s.poster_url} alt={s.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, background: seriesGradient(s) }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: "700 14px 'Hanken Grotesk'", color: '#f3f3f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.title}
                    </div>
                    <div style={{ font: "500 12px 'Hanken Grotesk'", color: '#8a8a95', marginTop: 3 }}>
                      {[s.platform, seasonEpLabel(s)].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: '50%', background: STATUS_DOT[s.status] }} />
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
