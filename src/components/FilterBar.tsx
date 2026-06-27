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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        type="search"
        placeholder="Pesquisar série..."
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: '#131318', border: '1px solid #26262e', borderRadius: 12,
          color: '#f3f3f5', font: "500 15px 'Hanken Grotesk'",
          padding: '12px 14px', outline: 'none',
        }}
      />
      <div className="noscroll" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
        <button
          onClick={() => onStatusChange('')}
          style={{
            flexShrink: 0,
            background: status === '' ? '#E11D2A' : '#16161b',
            color:      status === '' ? '#fff'    : '#b4b4bd',
            font: "600 12px 'Hanken Grotesk'",
            padding: '7px 14px', borderRadius: 999,
            border: status === '' ? 'none' : '1px solid #26262e',
            cursor: 'pointer',
          }}
        >
          Todos
        </button>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => onStatusChange(s)}
            style={{
              flexShrink: 0,
              background: status === s ? '#E11D2A' : '#16161b',
              color:      status === s ? '#fff'    : '#b4b4bd',
              font: "600 12px 'Hanken Grotesk'",
              padding: '7px 14px', borderRadius: 999,
              border: status === s ? 'none' : '1px solid #26262e',
              cursor: 'pointer',
            }}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      <select
        value={platform}
        onChange={e => onPlatformChange(e.target.value as Platform | '')}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: '#16161b', border: '1px solid #26262e', borderRadius: 12,
          color: platform ? '#f3f3f5' : '#71717a', font: "500 14px 'Hanken Grotesk'",
          padding: '11px 14px', outline: 'none',
        }}
      >
        <option value="">Todas as plataformas</option>
        {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
    </div>
  )
}
