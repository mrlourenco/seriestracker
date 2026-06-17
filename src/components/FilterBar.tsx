import type { SeriesStatus, Platform } from '../types'
import { STATUS_LABELS, PLATFORMS, STATUSES } from '../types'

interface Props {
  status: SeriesStatus | ''
  platform: Platform | ''
  search: string
  onStatusChange: (v: SeriesStatus | '') => void
  onPlatformChange: (v: Platform | '') => void
  onSearchChange: (v: string) => void
}

export default function FilterBar({ status, platform, search, onStatusChange, onPlatformChange, onSearchChange }: Props) {
  return (
    <div className="space-y-3">
      <input
        type="search"
        placeholder="Pesquisar série..."
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        className="input"
      />
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => onStatusChange('')}
          className={`flex-shrink-0 badge py-1.5 px-3 text-sm ${status === '' ? 'bg-brand-700 text-brand-100' : 'bg-slate-800 text-slate-300'}`}
        >
          Todos
        </button>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => onStatusChange(s)}
            className={`flex-shrink-0 badge py-1.5 px-3 text-sm ${status === s ? 'bg-brand-700 text-brand-100' : 'bg-slate-800 text-slate-300'}`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      <select
        value={platform}
        onChange={e => onPlatformChange(e.target.value as Platform | '')}
        className="input"
      >
        <option value="">Todas as plataformas</option>
        {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
    </div>
  )
}
