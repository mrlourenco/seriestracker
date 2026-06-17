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

export default function UpcomingEpisodes({ series }: Props) {
  const upcoming = series
    .filter(s => s.next_episode_date)
    .sort((a, b) => a.next_episode_date!.localeCompare(b.next_episode_date!))
    .slice(0, 10)

  if (upcoming.length === 0) return null

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-slate-200">Próximos episódios</h2>
      <div className="space-y-2">
        {upcoming.map(s => {
          const days = getDaysUntil(s.next_episode_date!)
          const isToday = days === 0
          const isSoon = days > 0 && days <= 7
          const isPast = days < 0

          return (
            <div
              key={s.id}
              className={`card flex items-start gap-3 ${isToday ? 'border-green-600 bg-green-950/30' : isSoon ? 'border-yellow-700/50' : ''}`}
            >
              <div className="flex-shrink-0 w-10 h-14 bg-slate-800 rounded-lg overflow-hidden">
                {s.poster_url
                  ? <img src={s.poster_url} alt={s.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-lg">📺</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-100 truncate text-sm">{s.title}</p>
                {(s.next_episode_season || s.next_episode_number) && (
                  <p className="text-xs text-slate-400">
                    {s.next_episode_season && `T${s.next_episode_season}`}
                    {s.next_episode_season && s.next_episode_number && ' · '}
                    {s.next_episode_number && `Ep ${s.next_episode_number}`}
                    {s.next_episode_title && ` — ${s.next_episode_title}`}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500">{formatDate(s.next_episode_date!)}</span>
                  {isToday && <span className="badge bg-green-900 text-green-300">Hoje!</span>}
                  {isSoon && !isToday && <span className="badge bg-yellow-900 text-yellow-300">Em {days}d</span>}
                  {isPast && <span className="badge bg-slate-700 text-slate-400">Passou</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
