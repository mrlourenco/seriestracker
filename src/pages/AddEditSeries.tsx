import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import SeriesForm from '../components/SeriesForm'
import { useSeries } from '../hooks/useSeries'
import type { Series, SeriesInsert } from '../types'

export default function AddEditSeries() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = (location.state as { prefill?: SeriesInsert } | null)?.prefill
  const { addSeries, updateSeries, getById } = useSeries()
  const [existing, setExisting] = useState<Series | undefined>()
  const [loading, setLoading] = useState(!!id)

  const isEdit = !!id

  useEffect(() => {
    if (!id) return
    getById(id).then(data => { if (data) setExisting(data); setLoading(false) })
  }, [id])

  const handleSubmit = async (data: SeriesInsert) => {
    if (isEdit && id) {
      await updateSeries(id, data)
      navigate(`/series/${id}`, { replace: true })
    } else {
      await addSeries(data)
      navigate('/series', { replace: true })
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

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-100">{isEdit ? 'Editar série' : 'Nova série'}</h1>
        <SeriesForm
          initial={existing ?? prefill}
          onSubmit={handleSubmit}
          onCancel={() => navigate(isEdit ? `/series/${id}` : '/series')}
        />
      </div>
    </Layout>
  )
}
