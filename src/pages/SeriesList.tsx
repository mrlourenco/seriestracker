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
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-100">As minhas séries</h1>
        <FilterBar
          status={status}
          platform={platform}
          search={search}
          onStatusChange={setStatus}
          onPlatformChange={setPlatform}
          onSearchChange={setSearch}
        />
        {error && <div className="bg-red-900/50 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm">{error}</div>}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
          </div>
        ) : series.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-slate-400">Nenhuma série encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {series.map(s => <SeriesCard key={s.id} series={s} />)}
          </div>
        )}
      </div>
    </Layout>
  )
}
