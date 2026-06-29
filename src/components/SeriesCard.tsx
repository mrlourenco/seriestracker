import { Link } from 'react-router-dom'
import { seriesGradient } from '../lib/gradients'
import { STATUS_BADGE } from '../lib/statusBadge'
import type { Series } from '../types'
import { STATUS_LABELS } from '../types'

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
          <div style={{ position: 'absolute', inset: 0, background: seriesGradient(series.title) }} />
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
        {(series.current_season !== null || series.current_episode !== null || series.rating !== null) && (
          <div style={{ display: 'flex', gap: 10, marginTop: 5, font: "500 12px 'Hanken Grotesk'", color: '#6b6b73' }}>
            {(series.current_season !== null || series.current_episode !== null) && (
              <span>
                {series.current_season !== null && `T${series.current_season}`}
                {series.current_season !== null && series.current_episode !== null && ' · '}
                {series.current_episode !== null && `Ep ${series.current_episode}`}
              </span>
            )}
            {series.rating !== null && <span style={{ color: '#fbbf24', fontWeight: 600 }}>★ {series.rating}/10</span>}
          </div>
        )}
      </div>
    </Link>
  )
}
