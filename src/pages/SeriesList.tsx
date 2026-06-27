import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import SeriesCard from '../components/SeriesCard'
import FilterBar from '../components/FilterBar'
import { useSeries } from '../hooks/useSeries'
import { useAuth } from '../hooks/useAuth'
import type { SeriesStatus, Platform } from '../types'

export default function SeriesList() {
  const { user, loading: authLoading } = useAuth()
  const [params] = useSearchParams()
  const [status, setStatus] = useState<SeriesStatus | ''>((params.get('status') as SeriesStatus) ?? '')
  const [platform, setPlatform] = useState<Platform | ''>('')
  const [search, setSearch] = useState('')

  const { series, loading, error } = useSeries({
    userId: authLoading ? null : user?.id,
    status: status || undefined,
    platform: platform || undefined,
    search: search || undefined,
  })

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 16px 20px' }}>
        <h1 style={{ font: "800 24px/1.1 'Hanken Grotesk'", color: '#f3f3f5', letterSpacing: '-.02em' }}>
          As minhas séries
        </h1>
        <FilterBar
          status={status}
          platform={platform}
          search={search}
          onStatusChange={setStatus}
          onPlatformChange={setPlatform}
          onSearchChange={setSearch}
        />
        {error && (
          <div style={{ background: 'rgba(127,29,29,.25)', border: '1px solid #7f1d1d', borderRadius: 14, padding: '14px 16px' }}>
            <p style={{ font: "500 13px 'Hanken Grotesk'", color: '#fca5a5' }}>{error}</p>
          </div>
        )}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #E11D2A', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : series.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ font: "500 14px 'Hanken Grotesk'", color: '#6b6b73' }}>Nenhuma série encontrada</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {series.map(s => <SeriesCard key={s.id} series={s} />)}
          </div>
        )}
      </div>
    </Layout>
  )
}
