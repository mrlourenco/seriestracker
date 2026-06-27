import { Link } from 'react-router-dom'
import type { Series } from '../types'

interface Props {
  series: Series[]
}

function getDaysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' })
}

const GRADIENTS = [
  'linear-gradient(150deg,#7f1d1d 0%,#dc2626 100%)',
  'linear-gradient(150deg,#0c4a6e 0%,#0891b2 100%)',
  'linear-gradient(150deg,#082f49 0%,#2563eb 100%)',
  'linear-gradient(150deg,#422006 0%,#d97706 100%)',
  'linear-gradient(150deg,#1e1b4b 0%,#4f46e5 100%)',
  'linear-gradient(150deg,#14532d 0%,#16a34a 100%)',
]

function seriesGradient(s: Series) {
  return GRADIENTS[(s.title.charCodeAt(0) ?? 0) % GRADIENTS.length]
}

export default function UpcomingEpisodes({ series }: Props) {
  const upcoming = series
    .filter(s => s.next_episode_date)
    .sort((a, b) => a.next_episode_date!.localeCompare(b.next_episode_date!))
    .slice(0, 10)

  if (upcoming.length === 0) return null

  return (
    <div style={{ padding: '4px 16px 20px' }}>
      <h2 style={{ font: "700 16px 'Hanken Grotesk'", color: '#f3f3f5', marginBottom: 12 }}>
        Próximos episódios
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {upcoming.map(s => {
          const days = getDaysUntil(s.next_episode_date!)
          const isToday = days === 0
          const isSoon = days > 0 && days <= 7
          const isPast = days < 0

          const borderColor = isToday ? '#16a34a' : isSoon ? '#854d0e' : '#20202a'
          const bgColor = isToday ? 'rgba(22,163,74,.08)' : '#131318'

          return (
            <Link
              key={s.id}
              to={`/series/${s.id}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 13,
                padding: '11px 13px', borderRadius: 15,
                background: bgColor, border: `1px solid ${borderColor}`,
                textDecoration: 'none',
              }}
            >
              <div style={{ flexShrink: 0, width: 42, height: 60, borderRadius: 8, overflow: 'hidden', background: '#1e1e26', position: 'relative' }}>
                {s.poster_url ? (
                  <img src={s.poster_url} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, background: seriesGradient(s) }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: "700 14px 'Hanken Grotesk'", color: '#f3f3f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.title}
                </div>
                {(s.next_episode_season || s.next_episode_number) && (
                  <div style={{ font: "500 12px 'Hanken Grotesk'", color: '#8a8a95', marginTop: 2 }}>
                    {s.next_episode_season && `T${s.next_episode_season}`}
                    {s.next_episode_season && s.next_episode_number && ' · '}
                    {s.next_episode_number && `Ep ${s.next_episode_number}`}
                    {s.next_episode_title && ` — ${s.next_episode_title}`}
                  </div>
                )}
                <div style={{ font: "500 11px 'Hanken Grotesk'", color: '#6b6b73', marginTop: 3 }}>
                  {formatDate(s.next_episode_date!)}
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                {isToday && (
                  <span style={{ background: 'rgba(22,163,74,.18)', color: '#4ade80', font: "700 10px 'Hanken Grotesk'", letterSpacing: '.05em', padding: '4px 9px', borderRadius: 6 }}>
                    HOJE
                  </span>
                )}
                {isSoon && !isToday && (
                  <span style={{ background: 'rgba(133,77,14,.2)', color: '#fbbf24', font: "700 10px 'Hanken Grotesk'", letterSpacing: '.05em', padding: '4px 9px', borderRadius: 6 }}>
                    {days}d
                  </span>
                )}
                {isPast && (
                  <span style={{ background: 'rgba(113,113,122,.15)', color: '#71717a', font: "700 10px 'Hanken Grotesk'", letterSpacing: '.05em', padding: '4px 9px', borderRadius: 6 }}>
                    PASSOU
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
