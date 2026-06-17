import { useState } from 'react'
import type { Series, SeriesInsert, SeriesStatus, Platform } from '../types'
import { STATUS_LABELS, STATUSES, PLATFORMS } from '../types'

interface Props {
  initial?: Series
  onSubmit: (data: SeriesInsert) => Promise<void>
  onCancel: () => void
}

const empty: SeriesInsert = {
  title: '',
  poster_url: null,
  status: 'want_to_watch',
  platform: null,
  current_season: null,
  current_episode: null,
  rating: null,
  notes: null,
  next_episode_date: null,
  next_episode_season: null,
  next_episode_number: null,
  next_episode_title: null,
}

function toFormData(s: Series): SeriesInsert {
  return {
    title: s.title,
    poster_url: s.poster_url,
    status: s.status,
    platform: s.platform,
    current_season: s.current_season,
    current_episode: s.current_episode,
    rating: s.rating,
    notes: s.notes,
    next_episode_date: s.next_episode_date,
    next_episode_season: s.next_episode_season,
    next_episode_number: s.next_episode_number,
    next_episode_title: s.next_episode_title,
  }
}

export default function SeriesForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<SeriesInsert>(initial ? toFormData(initial) : empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNext, setShowNext] = useState(
    !!(initial?.next_episode_date || initial?.next_episode_number)
  )

  const set = <K extends keyof SeriesInsert>(key: K, value: SeriesInsert[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('O título é obrigatório'); return }
    setSaving(true)
    setError(null)
    try {
      await onSubmit(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-900/50 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Título *</label>
        <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Nome da série" required />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">URL do poster</label>
        <input className="input" value={form.poster_url ?? ''} onChange={e => set('poster_url', e.target.value || null)} placeholder="https://..." type="url" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Estado *</label>
        <select className="input" value={form.status} onChange={e => set('status', e.target.value as SeriesStatus)}>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Plataforma</label>
        <select className="input" value={form.platform ?? ''} onChange={e => set('platform', (e.target.value || null) as Platform | null)}>
          <option value="">Selecionar...</option>
          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Temporada atual</label>
          <input className="input" type="number" min={1} value={form.current_season ?? ''} onChange={e => set('current_season', e.target.value ? Number(e.target.value) : null)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Episódio atual</label>
          <input className="input" type="number" min={1} value={form.current_episode ?? ''} onChange={e => set('current_episode', e.target.value ? Number(e.target.value) : null)} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Nota (1–10)</label>
        <input className="input" type="number" min={1} max={10} value={form.rating ?? ''} onChange={e => set('rating', e.target.value ? Number(e.target.value) : null)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Comentário pessoal</label>
        <textarea className="input min-h-[80px] resize-none" value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} placeholder="As tuas notas sobre esta série..." />
      </div>

      <button
        type="button"
        onClick={() => setShowNext(v => !v)}
        className="w-full text-left text-sm text-brand-400 hover:text-brand-300 py-1 flex items-center gap-2"
      >
        <span>{showNext ? '▼' : '▶'}</span> Próximo episódio
      </button>

      {showNext && (
        <div className="card space-y-3 border-brand-800">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Data de estreia</label>
            <input
              className="input"
              type="date"
              value={form.next_episode_date ?? ''}
              onChange={e => set('next_episode_date', e.target.value || null)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Temporada</label>
              <input className="input" type="number" min={1} value={form.next_episode_season ?? ''} onChange={e => set('next_episode_season', e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Episódio</label>
              <input className="input" type="number" min={1} value={form.next_episode_number ?? ''} onChange={e => set('next_episode_number', e.target.value ? Number(e.target.value) : null)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Título do episódio</label>
            <input className="input" value={form.next_episode_title ?? ''} onChange={e => set('next_episode_title', e.target.value || null)} placeholder="Opcional" />
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? 'A guardar...' : 'Guardar'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  )
}
