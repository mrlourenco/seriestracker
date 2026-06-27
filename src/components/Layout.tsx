import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const HomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5"/>
  </svg>
)
const SeriesIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>
  </svg>
)
const SearchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5"/>
  </svg>
)
const PeopleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 20a5.5 5.5 0 0 1 11 0M17.5 11a3 3 0 0 0 0-6M20.5 20a5.5 5.5 0 0 0-3.6-5.2"/>
  </svg>
)
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M12 6v12M6 12h12"/>
  </svg>
)

const TABS = [
  { to: '/',           Icon: HomeIcon,   label: 'Início',    cta: false },
  { to: '/series',     Icon: SeriesIcon, label: 'Séries',    cta: false },
  { to: '/series/new', Icon: null,       label: '',          cta: true  },
  { to: '/discover',   Icon: SearchIcon, label: 'Descobrir', cta: false },
  { to: '/shares',     Icon: PeopleIcon, label: 'Partilhas', cta: false },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    if (!window.confirm('Tens a certeza que queres sair?')) return
    await signOut()
    navigate('/login')
  }

  const initial = ((user?.user_metadata?.name ?? user?.email ?? '?')[0] ?? '?').toUpperCase()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0B0B0E' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 18px',
        background: 'rgba(11,11,14,0.94)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid #1b1b22',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <span style={{ width: 9, height: 20, background: '#E11D2A', borderRadius: 2, display: 'inline-block', transform: 'skewX(-9deg)' }} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ font: "800 19px 'Hanken Grotesk'", color: '#fff', letterSpacing: '-0.01em', lineHeight: 1 }}>SeriesTracker</span>
            <span style={{ font: "500 9px 'Hanken Grotesk'", color: '#4a4a55', letterSpacing: '.04em', lineHeight: 1 }}>
              v{__APP_VERSION__} · {__GIT_HASH__}
            </span>
          </span>
        </Link>
        <button
          onClick={handleSignOut}
          title="Sair"
          style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg,#3f3f46,#18181b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: "700 14px 'Hanken Grotesk'", color: '#e7e7ea',
            border: '1px solid #2a2a31', cursor: 'pointer',
          }}
        >
          {initial}
        </button>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, paddingBottom: 74 }}>
        {children}
      </main>

      {/* Bottom tab bar */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
        display: 'flex', alignItems: 'flex-start', paddingTop: 11,
        height: 74,
        background: 'rgba(11,11,14,0.94)',
        backdropFilter: 'blur(14px)',
        borderTop: '1px solid #1b1b22',
      }}>
        {TABS.map(({ to, Icon, label, cta }) => {
          const exact = to === '/'
          const active = exact
            ? location.pathname === '/'
            : to === '/series'
              ? location.pathname === '/series' || (location.pathname.startsWith('/series/') && !location.pathname.startsWith('/series/new') && !/\/series\/[^/]+\/edit/.test(location.pathname))
              : location.pathname.startsWith(to)
          const color = active ? '#E11D2A' : '#6b6b73'

          return (
            <Link
              key={to}
              to={to}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, textDecoration: 'none' }}
            >
              {cta ? (
                <div style={{ width: 46, height: 34, borderRadius: 11, background: '#E11D2A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <PlusIcon />
                </div>
              ) : Icon ? (
                <>
                  <span style={{ color }}><Icon /></span>
                  <span style={{ font: "600 10px 'Hanken Grotesk'", color }}>{label}</span>
                </>
              ) : null}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
