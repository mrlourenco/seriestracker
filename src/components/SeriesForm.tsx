import { useState } from 'react'
import type { Series, SeriesInsert, SeriesStatus, Platform } from '../types'
import { STATUS_LABELS, STATUSES, PLATFORMS } from '../types'

interface Props {
  initial?: Series | SeriesInsert
  onSubmit: (data: SeriesInsert) => Promise<void>
  onCancel: () => void
}

const empty: SeriesInsert = {
  title: '',
  poster_url: null,
  tmdb_id: null,
  status: 'want_to_watch',
  platform: null,
  genres: null,
  current_season: null,
  current_episode: null,
  rating: null,
  notes: null,
  next_episode_date: null,
  next_episode_season: null,
  next_episode_number: null,
  next_episode_title: null,
}

function toFormData(s: Series | SeriesInsert): SeriesInsert {
  return {
    title: s.title,
    poster_url: s.poster_url,
    tmdb_id: s.tmdb_id ?? null,
    status: s.status,
    platform: s.platform,
    genres: s.genres ?? null,
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

const labelStyle: React.CSSProperties = {
  display: 'block',
  font: "600 12px 'Hanken Grotesk'",
  color: '#8a8a95',
  letterSpacing: '.04em',
  textTransform: 'uppercase',
  marginBottom: 6,
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
    if (form.rating !== null && (form.rating < 1 || form.rating > 10)) {
      setError('A nota tem de ser entre 1 e 10')
      return
    }
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{ background: 'rgba(127,29,29,.25)', border: '1px solid #7f1d1d', borderRadius: 14, padding: '12px 16px' }}>
          <p style={{ font: "500 13px 'Hanken Grotesk'", color: '#fca5a5' }}>{error}</p>
        </div>
      )}

      <div>
        <label style={labelStyle}>Título *</label>
        <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Nome da série" required />
      </div>

      <div>
        <label style={labelStyle}>URL do poster</label>
        <input className="input" value={form.poster_url ?? ''} onChange={e => set('poster_url', e.target.value || null)} placeholder="https://..." type="url" />
        {form.poster_url && (
          <div style={{ marginTop: 8, width: 56, height: 80, borderRadius: 8, overflow: 'hidden', background: '#1e1e26' }}>
            <img
              src={form.poster_url}
              alt="Preview"
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        )}
      </div>

      <div>
        <label style={labelStyle}>Estado *</label>
        <select className="input" value={form.status} onChange={e => set('status', e.target.value as SeriesStatus)}>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Plataforma</label>
        <select className="input" value={form.platform ?? ''} onChange={e => set('platform', (e.target.value || null) as Platform | null)}>
          <option value="">Selecionar...</option>
          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Temporada atual</label>
          <input className="input" type="number" min={1} value={form.current_season ?? ''} onChange={e => set('current_season', e.target.value ? Number(e.target.value) : null)} />
        </div>
        <div>
          <label style={labelStyle}>Episódio atual</label>
          <input className="input" type="number" min={1} value={form.current_episode ?? ''} onChange={e => set('current_episode', e.target.value ? Number(e.target.value) : null)} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Nota</label>
        <div role="group" aria-label="Nota de 1 a 10" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex' }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
              const filled = form.rating !== null && n <= form.rating
              return (
                <button
                  key={n}
                  type="button"
                  aria-pressed={form.rating === n}
                  aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
                  onClick={() => set('rating', form.rating === n ? null : n)}
                  style={{
                    // 3px lateral keeps 10 stars within a 360px viewport;
                    // wider padding would overflow the row
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '8px 3px', fontSize: 24, lineHeight: 1,
                    color: filled ? '#fbbf24' : '#33333c',
                    textShadow: filled ? '0 0 12px rgba(251,191,36,.35)' : 'none',
                    transition: 'color .15s',
                  }}
                >
                  ★
                </button>
              )
            })}
          </div>
          {form.rating !== null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ font: "800 16px 'Hanken Grotesk'", color: '#fbbf24' }}>
                {form.rating}<span style={{ font: "600 11px 'Hanken Grotesk'", color: '#6b6b73' }}>/10</span>
              </span>
              <button
                type="button"
                onClick={() => set('rating', null)}
                style={{
                  // Positive padding + equal negative margin enlarges the tap
                  // area without shifting the visual layout
                  background: 'none', border: 'none', cursor: 'pointer',
                  font: "600 12px 'Hanken Grotesk'", color: '#6b6b73',
                  padding: '8px 12px', margin: '-8px -12px',
                  textDecoration: 'underline',
                }}
              >
                Limpar
              </button>
            </div>
          ) : (
            <span style={{ font: "500 12px 'Hanken Grotesk'", color: '#4a4a55' }}>Sem nota</span>
          )}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Comentário pessoal</label>
        <textarea className="input" style={{ minHeight: 80, resize: 'none' }} value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} placeholder="As tuas notas sobre esta série..." />
      </div>

      <button
        type="button"
        onClick={() => setShowNext(v => !v)}
        style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 8, font: "600 13px 'Hanken Grotesk'", color: '#E11D2A' }}
      >
        <span>{showNext ? '▼' : '▶'}</span> Próximo episódio
      </button>

      {showNext && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Data de estreia</label>
            <input
              className="input"
              type="date"
              value={form.next_episode_date ?? ''}
              onChange={e => set('next_episode_date', e.target.value || null)}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Temporada</label>
              <input className="input" type="number" min={1} value={form.next_episode_season ?? ''} onChange={e => set('next_episode_season', e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <label style={labelStyle}>Episódio</label>
              <input className="input" type="number" min={1} value={form.next_episode_number ?? ''} onChange={e => set('next_episode_number', e.target.value ? Number(e.target.value) : null)} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Título do episódio</label>
            <input className="input" value={form.next_episode_title ?? ''} onChange={e => set('next_episode_title', e.target.value || null)} placeholder="Opcional" />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
        <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
          {saving ? 'A guardar...' : 'Guardar'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  )
}
