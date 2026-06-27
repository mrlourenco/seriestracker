import { Link } from 'react-router-dom'
import type { Series, SeriesStatus } from '../types'
import { STATUS_LABELS } from '../types'

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

const STATUS_BADGE: Record<SeriesStatus, { bg: string; color: string }> = {
  watching:      { bg: 'rgba(22,163,74,.15)',   color: '#4ade80' },
  want_to_watch: { bg: 'rgba(251,191,36,.12)',  color: '#fbbf24' },
  completed:     { bg: 'rgba(96,165,250,.12)',  color: '#60a5fa' },
  dropped:       { bg: 'rgba(248,113,113,.12)', color: '#f87171' },
  archived:      { bg: 'rgba(113,113,122,.12)', color: '#9ca3af' },
}

interface Props {
  series: Series
  ownerName?: string
}

export default function SeriesCard({ series, ownerName }: Props) {
  const badge = STATUS_BADGE[series.status]

  return (
    <Link
      to={`/series/${series.id}`}
      style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 13px', borderRadius: 15, background: '#131318', border: '1px solid #20202a', textDecoration: 'none' }}
    >
      <div style={{ flexShrink: 0, width: 42, height: 60, borderRadius: 8, overflow: 'hidden', background: '#1e1e26', position: 'relative' }}>
        {series.poster_url ? (
          <img src={series.poster_url} alt={series.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: seriesGradient(series) }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "700 14px 'Hanken Grotesk'", color: '#f3f3f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {series.title}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 5 }}>
          <span style={{ background: badge.bg, color: badge.color, font: "600 11px 'Hanken Grotesk'", padding: '3px 8px', borderRadius: 6 }}>
            {STATUS_LABELS[series.status]}
          </span>
          {series.platform && (
            <span style={{ background: 'rgba(255,255,255,.06)', color: '#9ca3af', font: "500 11px 'Hanken Grotesk'", padding: '3px 8px', borderRadius: 6 }}>
              {series.platform}
            </span>
          )}
          {ownerName && (
            <span style={{ background: 'rgba(99,102,241,.15)', color: '#a5b4fc', font: "500 11px 'Hanken Grotesk'", padding: '3px 8px', borderRadius: 6 }}>
              {ownerName}
            </span>
          )}
        </div>
        {(series.current_season || series.current_episode || series.rating) && (
          <div style={{ display: 'flex', gap: 10, marginTop: 5, font: "500 12px 'Hanken Grotesk'", color: '#6b6b73' }}>
            {(series.current_season || series.current_episode) && (
              <span>
                {series.current_season && `T${series.current_season}`}
                {series.current_season && series.current_episode && ' · '}
                {series.current_episode && `Ep ${series.current_episode}`}
              </span>
            )}
            {series.rating && <span>★ {series.rating}/10</span>}
          </div>
        )}
      </div>
    </Link>
  )
}
