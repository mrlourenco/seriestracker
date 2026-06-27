import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import SeriesForm from '../components/SeriesForm'
import Spinner from '../components/Spinner'
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
    getById(id).then(data => {
      if (data) {
        setExisting(data)
      } else {
        navigate('/series', { replace: true })
      }
      setLoading(false)
    })
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
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <Spinner />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 16px 20px' }}>
        <h1 style={{ font: "800 24px/1.1 'Hanken Grotesk'", color: '#f3f3f5', letterSpacing: '-.02em' }}>
          {isEdit ? 'Editar série' : 'Nova série'}
        </h1>
        <SeriesForm
          initial={existing ?? prefill}
          onSubmit={handleSubmit}
          onCancel={() => navigate(isEdit ? `/series/${id}` : '/series')}
        />
      </div>
    </Layout>
  )
}
