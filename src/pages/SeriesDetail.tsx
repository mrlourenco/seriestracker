import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useSeries } from '../hooks/useSeries'
import { useAuth } from '../hooks/useAuth'
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

const Spinner = () => (
  <>
    <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #E11D2A', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </>
)

export default function SeriesDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getById, deleteSeries } = useSeries()
  const [series, setSeries] = useState<Series | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    getById(id).then(data => { setSeries(data); setLoading(false) })
  }, [id])

  const handleDelete = async () => {
    if (!series || !confirm(`Eliminar "${series.title}"?`)) return
    setDeleting(true)
    try {
      await deleteSeries(series.id)
      navigate('/series', { replace: true })
    } catch {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <Spinner />
        </div>
      </Layout>
    )
  }

  if (!series) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '64px 20px' }}>
          <p style={{ font: "500 15px 'Hanken Grotesk'", color: '#6b6b73', marginBottom: 16 }}>Série não encontrada</p>
          <Link to="/series" className="btn-secondary" style={{ display: 'inline-block' }}>Voltar</Link>
        </div>
      </Layout>
    )
  }

  const badge = STATUS_BADGE[series.status]

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 16px 20px' }}>

        {/* Header: poster + title/meta */}
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flexShrink: 0, width: 90, height: 134, borderRadius: 14, overflow: 'hidden', background: '#1e1e26', position: 'relative' }}>
            {series.poster_url ? (
              <img src={series.poster_url} alt={series.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ position: 'absolute', inset: 0, background: seriesGradient(series) }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ font: "800 22px/1.1 'Hanken Grotesk'", color: '#f3f3f5', letterSpacing: '-.02em', wordBreak: 'break-word' }}>
              {series.title}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              <span style={{ background: badge.bg, color: badge.color, font: "600 12px 'Hanken Grotesk'", padding: '4px 10px', borderRadius: 8 }}>
                {STATUS_LABELS[series.status]}
              </span>
              {series.platform && (
                <span style={{ background: 'rgba(255,255,255,.06)', color: '#9ca3af', font: "500 12px 'Hanken Grotesk'", padding: '4px 10px', borderRadius: 8 }}>
                  {series.platform}
                </span>
              )}
            </div>
            {series.rating && (
              <p style={{ font: "600 14px 'Hanken Grotesk'", color: '#fbbf24', marginTop: 10 }}>
                ★ {series.rating}<span style={{ color: '#6b6b73', fontWeight: 400 }}>/10</span>
              </p>
            )}
          </div>
        </div>

        {/* Progress */}
        {(series.current_season || series.current_episode) && (
          <div className="card">
            <p style={{ font: "600 10px 'Hanken Grotesk'", color: '#6b6b73', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Progresso
            </p>
            <p style={{ font: "500 15px 'Hanken Grotesk'", color: '#d4d4d8' }}>
              {series.current_season && <span>Temporada {series.current_season}</span>}
              {series.current_season && series.current_episode && <span style={{ color: '#3f3f46' }}> · </span>}
              {series.current_episode && <span>Episódio {series.current_episode}</span>}
            </p>
          </div>
        )}

        {/* Next episode */}
        {series.next_episode_date && (
          <div className="card">
            <p style={{ font: "600 10px 'Hanken Grotesk'", color: '#6b6b73', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Próximo episódio
            </p>
            <p style={{ font: "500 15px 'Hanken Grotesk'", color: '#d4d4d8' }}>
              {new Date(series.next_episode_date).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {(series.next_episode_season || series.next_episode_number) && (
              <p style={{ font: "500 13px 'Hanken Grotesk'", color: '#6b6b73', marginTop: 3 }}>
                {series.next_episode_season && `T${series.next_episode_season}`}
                {series.next_episode_season && series.next_episode_number && ' · '}
                {series.next_episode_number && `Ep ${series.next_episode_number}`}
                {series.next_episode_title && ` — ${series.next_episode_title}`}
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        {series.notes && (
          <div className="card">
            <p style={{ font: "600 10px 'Hanken Grotesk'", color: '#6b6b73', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Notas
            </p>
            <p style={{ font: "500 14px/1.5 'Hanken Grotesk'", color: '#b4b4bd', whiteSpace: 'pre-wrap' }}>{series.notes}</p>
          </div>
        )}

        {/* Added date */}
        <div className="card">
          <p style={{ font: "600 10px 'Hanken Grotesk'", color: '#6b6b73', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            Adicionada em
          </p>
          <p style={{ font: "500 14px 'Hanken Grotesk'", color: '#b4b4bd' }}>
            {new Date(series.created_at).toLocaleDateString('pt-PT')}
          </p>
        </div>

        {/* Actions */}
        {series.user_id === user?.id && (
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to={`/series/${series.id}/edit`} className="btn-primary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
              Editar
            </Link>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger">
              {deleting ? '...' : 'Eliminar'}
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
