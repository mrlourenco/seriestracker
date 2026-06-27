import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Layout from '../components/Layout'
import SeriesTMDBInfo from '../components/TMDBSeriesInfo'
import { useSeries } from '../hooks/useSeries'
import { useAuth } from '../hooks/useAuth'
import type { Series } from '../types'
import { STATUS_LABELS, STATUS_COLORS } from '../types'

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
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
        </div>
      </Layout>
    )
  }

  if (!series) {
    return (
      <Layout>
        <div className="card text-center py-10">
          <p className="text-lg text-slate-400 mb-2">Série não encontrada</p>
          <Link to="/series" className="btn-secondary inline-block mt-4">Voltar</Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="card space-y-3">
          <h1 className="text-2xl font-bold text-slate-100 break-words">{series.title}</h1>
          <div className="flex flex-wrap gap-1.5">
            <span className={`badge ${STATUS_COLORS[series.status]}`}>{STATUS_LABELS[series.status]}</span>
            {series.platform && <span className="badge bg-slate-700 text-slate-300">{series.platform}</span>}
          </div>
          {series.rating && (
            <p className="text-sm text-slate-300">
              <span className="text-yellow-400">{'★'.repeat(Math.round(series.rating / 2) || 1)}</span>
              {' '}{series.rating}/10
            </p>
          )}
        </div>

        <SeriesTMDBInfo title={series.title} fallbackPosterUrl={series.poster_url} tmdbId={series.tmdb_id} />

        {(series.current_season || series.current_episode) && (
          <div className="card">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Progresso</p>
            <p className="text-slate-200">
              {series.current_season && <span>Temporada {series.current_season}</span>}
              {series.current_season && series.current_episode && <span className="text-slate-500"> · </span>}
              {series.current_episode && <span>Episódio {series.current_episode}</span>}
            </p>
          </div>
        )}

        {series.notes && (
          <div className="card">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Notas</p>
            <p className="text-slate-300 text-sm whitespace-pre-wrap">{series.notes}</p>
          </div>
        )}

        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Adicionada em</p>
          <p className="text-slate-400 text-sm">{new Date(series.created_at).toLocaleDateString('pt-PT')}</p>
        </div>

        {series.user_id === user?.id && (
          <div className="flex gap-3">
            <Link to={`/series/${series.id}/edit`} className="btn-primary flex-1 text-center">Editar</Link>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger">
              {deleting ? '...' : 'Eliminar'}
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
