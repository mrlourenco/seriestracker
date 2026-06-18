import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../hooks/useAuth'

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>)
}

describe('ProtectedRoute', () => {
  it('shows a spinner while the auth state is loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      loading: true,
      session: null,
      user: null,
      signInWithGoogle: vi.fn(),
      signInWithGitHub: vi.fn(),
      signOut: vi.fn(),
    })
    const { container } = renderWithRouter(
      <ProtectedRoute><div>Protected content</div></ProtectedRoute>
    )
    // Spinner: a div with animate-spin class; no protected content
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('redirects to /login when the user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      loading: false,
      session: null,
      user: null,
      signInWithGoogle: vi.fn(),
      signInWithGitHub: vi.fn(),
      signOut: vi.fn(),
    })
    renderWithRouter(
      <ProtectedRoute><div>Protected content</div></ProtectedRoute>
    )
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders children when the user is authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      loading: false,
      session: { user: { id: 'u1' } } as any,
      user: { id: 'u1' } as any,
      signInWithGoogle: vi.fn(),
      signInWithGitHub: vi.fn(),
      signOut: vi.fn(),
    })
    renderWithRouter(
      <ProtectedRoute><div>Protected content</div></ProtectedRoute>
    )
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })
})
