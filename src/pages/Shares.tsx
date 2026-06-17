import { useState } from 'react'
import Layout from '../components/Layout'
import { useShares } from '../hooks/useShares'

export default function Shares() {
  const { myShares, sharedWithMe, loading, addShare, removeShare } = useShares()
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setAdding(true)
    setError(null)
    try {
      await addShare(email)
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao partilhar')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Remover esta partilha?')) return
    await removeShare(id)
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-100">Partilhas</h1>

        <div className="card space-y-3">
          <h2 className="font-semibold text-slate-200">Partilhar o meu dashboard</h2>
          <p className="text-sm text-slate-400">Introduz o email de outra conta SeriesTracker. Essa pessoa poderá ver o teu dashboard em modo leitura.</p>
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              className="input flex-1"
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button type="submit" className="btn-primary" disabled={adding}>
              {adding ? '...' : 'Partilhar'}
            </button>
          </form>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <h2 className="font-semibold text-slate-200">Partilhei com</h2>
              {myShares.length === 0
                ? <p className="text-slate-500 text-sm">Ainda não partilhaste com ninguém.</p>
                : myShares.map(s => (
                  <div key={s.id} className="card flex items-center gap-3">
                    {s.viewer.avatar_url
                      ? <img src={s.viewer.avatar_url} className="w-9 h-9 rounded-full" alt="" />
                      : <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm">👤</div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-200 truncate">{s.viewer.display_name ?? s.viewer.email}</p>
                      <p className="text-xs text-slate-500 truncate">{s.viewer.email}</p>
                    </div>
                    <button onClick={() => handleRemove(s.id)} className="text-red-400 hover:text-red-300 text-sm px-2 py-1">
                      Remover
                    </button>
                  </div>
                ))
              }
            </div>

            <div className="space-y-3">
              <h2 className="font-semibold text-slate-200">Dashboards partilhados comigo</h2>
              {sharedWithMe.length === 0
                ? <p className="text-slate-500 text-sm">Ninguém partilhou o dashboard contigo ainda.</p>
                : sharedWithMe.map(s => (
                  <div key={s.id} className="card flex items-center gap-3">
                    {s.owner.avatar_url
                      ? <img src={s.owner.avatar_url} className="w-9 h-9 rounded-full" alt="" />
                      : <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm">👤</div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-200 truncate">{s.owner.display_name ?? s.owner.email}</p>
                      <p className="text-xs text-slate-500 truncate">{s.owner.email}</p>
                    </div>
                    <span className="badge bg-slate-700 text-slate-400 text-xs">Leitura</span>
                  </div>
                ))
              }
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
