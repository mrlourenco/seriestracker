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
}

export default function SeriesForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<SeriesInsert>(
    initial
      ? {
          title: initial.title,
          poster_url: initial.poster_url,
          status: initial.status,
          platform: initial.platform,
          current_season: initial.current_season,
          current_episode: initial.current_episode,
          rating: initial.rating,
          notes: initial.notes,
        }
      : empty
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? 'A guardar...' : 'Guardar'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  )
}
