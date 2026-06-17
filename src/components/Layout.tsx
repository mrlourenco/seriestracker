import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navItems = [
    { to: '/', label: 'Dashboard', icon: '🏠' },
    { to: '/series', label: 'Séries', icon: '📺' },
    { to: '/series/new', label: 'Adicionar', icon: '➕' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-brand-400">📺 SeriesTracker</Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:block truncate max-w-[160px]">
            {user?.email ?? user?.user_metadata?.name ?? ''}
          </span>
          <button onClick={handleSignOut} className="btn-secondary text-sm py-1.5 px-3">
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      <nav className="sticky bottom-0 bg-slate-900 border-t border-slate-800 grid grid-cols-3">
        {navItems.map(({ to, label, icon }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center py-3 text-xs gap-1 transition-colors ${
                active ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-xl">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
