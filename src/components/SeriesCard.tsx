import { Link } from 'react-router-dom'
import type { Series } from '../types'
import { STATUS_LABELS, STATUS_COLORS } from '../types'

interface Props {
  series: Series
  ownerName?: string
}

export default function SeriesCard({ series, ownerName }: Props) {
  return (
    <Link to={`/series/${series.id}`} className="card flex gap-3 hover:border-slate-600 transition-colors">
      <div className="flex-shrink-0 w-14 h-20 bg-slate-800 rounded-lg overflow-hidden">
        {series.poster_url ? (
          <img src={series.poster_url} alt={series.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">📺</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-100 truncate">{series.title}</h3>
        <div className="flex flex-wrap gap-1.5 mt-1">
          <span className={`badge ${STATUS_COLORS[series.status]}`}>
            {STATUS_LABELS[series.status]}
          </span>
          {series.platform && (
            <span className="badge bg-slate-700 text-slate-300">{series.platform}</span>
          )}
          {ownerName && (
            <span className="badge bg-indigo-950 text-indigo-300 border border-indigo-800">{ownerName}</span>
          )}
        </div>
        <div className="mt-1.5 text-xs text-slate-400 space-y-0.5">
          {(series.current_season || series.current_episode) && (
            <p>
              {series.current_season && `T${series.current_season}`}
              {series.current_season && series.current_episode && ' · '}
              {series.current_episode && `Ep ${series.current_episode}`}
            </p>
          )}
          {series.rating && <p>{'⭐'.repeat(Math.round(series.rating / 2))} {series.rating}/10</p>}
        </div>
      </div>
    </Link>
  )
}
