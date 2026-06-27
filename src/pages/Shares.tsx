import { useState } from 'react'
import Layout from '../components/Layout'
import Spinner from '../components/Spinner'
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

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <p style={{ font: "700 15px 'Hanken Grotesk'", color: '#d4d4d8' }}>{children}</p>
  )

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '20px 16px 20px' }}>
        <h1 style={{ font: "800 24px/1.1 'Hanken Grotesk'", color: '#f3f3f5', letterSpacing: '-.02em' }}>Partilhas</h1>

        {/* Share form */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SectionTitle>Partilhar o meu dashboard</SectionTitle>
          <p style={{ font: "500 13px 'Hanken Grotesk'", color: '#6b6b73' }}>
            Introduz o email de outra conta SeriesTracker. Essa pessoa poderá ver o teu dashboard em modo leitura.
          </p>
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10 }}>
            <input
              className="input"
              style={{ flex: 1 }}
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button type="submit" className="btn-primary" disabled={adding}>
              {adding ? '...' : 'Partilhar'}
            </button>
          </form>
          {error && <p style={{ font: "500 13px 'Hanken Grotesk'", color: '#f87171' }}>{error}</p>}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Spinner size={28} />
          </div>
        ) : (
          <>
            {/* My shares */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SectionTitle>Partilhei com</SectionTitle>
              {myShares.length === 0 ? (
                <p style={{ font: "500 13px 'Hanken Grotesk'", color: '#6b6b73' }}>Ainda não partilhaste com ninguém.</p>
              ) : myShares.map(s => (
                <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {s.viewer.avatar_url ? (
                    <img src={s.viewer.avatar_url} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#26262e', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 14px 'Hanken Grotesk'", color: '#8a8a95' }}>
                      {(s.viewer.display_name ?? s.viewer.email ?? '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ font: "600 14px 'Hanken Grotesk'", color: '#f3f3f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.viewer.display_name ?? s.viewer.email}
                    </p>
                    <p style={{ font: "500 12px 'Hanken Grotesk'", color: '#6b6b73', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.viewer.email}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(s.id)}
                    style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', font: "600 13px 'Hanken Grotesk'", color: '#f87171', padding: '4px 8px' }}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>

            {/* Shared with me */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SectionTitle>Dashboards partilhados comigo</SectionTitle>
              {sharedWithMe.length === 0 ? (
                <p style={{ font: "500 13px 'Hanken Grotesk'", color: '#6b6b73' }}>Ninguém partilhou o dashboard contigo ainda.</p>
              ) : sharedWithMe.map(s => (
                <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {s.owner.avatar_url ? (
                    <img src={s.owner.avatar_url} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#26262e', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 14px 'Hanken Grotesk'", color: '#8a8a95' }}>
                      {(s.owner.display_name ?? s.owner.email ?? '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ font: "600 14px 'Hanken Grotesk'", color: '#f3f3f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.owner.display_name ?? s.owner.email}
                    </p>
                    <p style={{ font: "500 12px 'Hanken Grotesk'", color: '#6b6b73', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.owner.email}
                    </p>
                  </div>
                  <span style={{ flexShrink: 0, background: 'rgba(255,255,255,.06)', color: '#6b6b73', font: "500 11px 'Hanken Grotesk'", padding: '3px 9px', borderRadius: 6 }}>
                    Leitura
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
