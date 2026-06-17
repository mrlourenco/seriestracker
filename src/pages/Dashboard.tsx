import { useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import SeriesCard from '../components/SeriesCard'
import UpcomingEpisodes from '../components/UpcomingEpisodes'
import { useSeries } from '../hooks/useSeries'
import { useShares } from '../hooks/useShares'
import { useAuth } from '../hooks/useAuth'

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const { sharedWithMe } = useShares()
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)

  const isOwnDashboard = viewingUserId === null
  const resolvedUserId = authLoading ? null : (viewingUserId ?? user?.id ?? null)
  const { series, loading } = useSeries({ userId: resolvedUserId })

  const watching = series.filter(s => s.status === 'watching')
  const wantToWatch = series.filter(s => s.status === 'want_to_watch')
  const completed = series.filter(s => s.status === 'completed')

  const viewingName = viewingUserId
    ? (sharedWithMe.find(s => s.owner_id === viewingUserId)?.owner.display_name ?? 'Utilizador')
    : (user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'utilizador')

  return (
    <Layout>
      <div className="space-y-6">
        {sharedWithMe.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setViewingUserId(null)}
              className={`flex-shrink-0 badge py-1.5 px-3 text-sm ${isOwnDashboard ? 'bg-brand-700 text-brand-100' : 'bg-slate-800 text-slate-300'}`}
            >
              O meu
            </button>
            {sharedWithMe.map(s => (
              <button
                key={s.id}
                onClick={() => setViewingUserId(s.owner_id)}
                className={`flex-shrink-0 badge py-1.5 px-3 text-sm ${viewingUserId === s.owner_id ? 'bg-brand-700 text-brand-100' : 'bg-slate-800 text-slate-300'}`}
              >
                {s.owner.display_name ?? s.owner.email?.split('@')[0]}
              </button>
            ))}
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            {isOwnDashboard ? `Olá, ${viewingName} 👋` : `Dashboard de ${viewingName}`}
          </h1>
          <p className="text-slate-400 mt-1">
            {series.length} {series.length === 1 ? 'série' : 'séries'} na lista
            {!isOwnDashboard && <span className="ml-2 badge bg-slate-700 text-slate-400">Só leitura</span>}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'A ver', count: watching.length, color: 'text-green-400' },
                { label: 'Para ver', count: wantToWatch.length, color: 'text-yellow-400' },
                { label: 'Terminadas', count: completed.length, color: 'text-blue-400' },
              ].map(({ label, count, color }) => (
                <div key={label} className="card text-center">
                  <p className={`text-2xl font-bold ${color}`}>{count}</p>
                  <p className="text-xs text-slate-400 mt-1">{label}</p>
                </div>
              ))}
            </div>

            <UpcomingEpisodes series={series} />

            {watching.length > 0 && (
              <Section title="A ver agora" count={watching.length} to={isOwnDashboard ? '/series?status=watching' : '#'}>
                {watching.slice(0, 3).map(s => <SeriesCard key={s.id} series={s} />)}
              </Section>
            )}

            {wantToWatch.length > 0 && (
              <Section title="Para ver" count={wantToWatch.length} to={isOwnDashboard ? '/series?status=want_to_watch' : '#'}>
                {wantToWatch.slice(0, 3).map(s => <SeriesCard key={s.id} series={s} />)}
              </Section>
            )}

            {series.length === 0 && isOwnDashboard && (
              <div className="card text-center py-12">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-slate-300 font-medium">Nenhuma série ainda</p>
                <p className="text-slate-500 text-sm mt-1">Adiciona a tua primeira série</p>
                <Link to="/series/new" className="btn-primary inline-block mt-4">Adicionar série</Link>
              </div>
            )}
            {series.length === 0 && !isOwnDashboard && (
              <div className="card text-center py-12">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-slate-400">Esta pessoa ainda não tem séries.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

function Section({ title, count, to, children }: { title: string; count: number; to: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-200">{title} <span className="text-slate-500 text-sm">({count})</span></h2>
        {to !== '#' && <Link to={to} className="text-sm text-brand-400 hover:text-brand-300">Ver todas</Link>}
      </div>
      {children}
    </div>
  )
}
