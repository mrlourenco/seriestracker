import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import SeriesCard from '../components/SeriesCard'
import { useSeries } from '../hooks/useSeries'
import { useAuth } from '../hooks/useAuth'

export default function Dashboard() {
  const { user } = useAuth()
  const { series, loading } = useSeries()

  const watching = series.filter(s => s.status === 'watching')
  const wantToWatch = series.filter(s => s.status === 'want_to_watch')
  const completed = series.filter(s => s.status === 'completed')

  const name = user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'utilizador'

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Olá, {name} 👋</h1>
          <p className="text-slate-400 mt-1">{series.length} {series.length === 1 ? 'série' : 'séries'} na tua lista</p>
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

            {watching.length > 0 && (
              <Section title="A ver agora" count={watching.length} to="/series?status=watching">
                {watching.slice(0, 3).map(s => <SeriesCard key={s.id} series={s} />)}
              </Section>
            )}

            {wantToWatch.length > 0 && (
              <Section title="Para ver" count={wantToWatch.length} to="/series?status=want_to_watch">
                {wantToWatch.slice(0, 3).map(s => <SeriesCard key={s.id} series={s} />)}
              </Section>
            )}

            {series.length === 0 && (
              <div className="card text-center py-12">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-slate-300 font-medium">Nenhuma série ainda</p>
                <p className="text-slate-500 text-sm mt-1">Adiciona a tua primeira série</p>
                <Link to="/series/new" className="btn-primary inline-block mt-4">Adicionar série</Link>
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
        <Link to={to} className="text-sm text-brand-400 hover:text-brand-300">Ver todas</Link>
      </div>
      {children}
    </div>
  )
}
