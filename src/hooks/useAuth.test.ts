import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from './useAuth'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

import { supabase } from '../lib/supabase'

const mockSubscription = { unsubscribe: vi.fn() }
const mockUser = { id: 'user-1', email: 'test@example.com' }
const mockSession = { user: mockUser, access_token: 'token-123' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: null },
    error: null,
  } as any)
  vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
    data: { subscription: mockSubscription },
  } as any)
})

describe('useAuth', () => {
  it('starts with loading=true and no session', () => {
    // Never resolves so we can inspect the initial synchronous state
    vi.mocked(supabase.auth.getSession).mockReturnValue(new Promise(() => {}) as any)
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(true)
    expect(result.current.session).toBeNull()
    expect(result.current.user).toBeNull()
  })

  it('sets session and user after getSession resolves', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any)
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.session).toEqual(mockSession)
    expect(result.current.user).toEqual(mockUser)
  })

  it('sets loading=false with null session when unauthenticated', async () => {
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.session).toBeNull()
    expect(result.current.user).toBeNull()
  })

  it('updates state when onAuthStateChange fires a SIGNED_IN event', async () => {
    let authCallback: ((event: string, session: unknown) => void) | undefined
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((cb: any) => {
      authCallback = cb
      return { data: { subscription: mockSubscription } } as any
    })
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { authCallback?.('SIGNED_IN', mockSession) })

    expect(result.current.session).toEqual(mockSession)
    expect(result.current.user).toEqual(mockUser)
  })

  it('clears state when onAuthStateChange fires a SIGNED_OUT event', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any)
    let authCallback: ((event: string, session: unknown) => void) | undefined
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((cb: any) => {
      authCallback = cb
      return { data: { subscription: mockSubscription } } as any
    })
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.session).toEqual(mockSession))

    act(() => { authCallback?.('SIGNED_OUT', null) })

    expect(result.current.session).toBeNull()
    expect(result.current.user).toBeNull()
  })

  it('calls subscription.unsubscribe on unmount', async () => {
    const { unmount } = renderHook(() => useAuth())
    await waitFor(() => expect(result => result).toBeTruthy())
    unmount()
    expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('signInWithGoogle calls signInWithOAuth with google provider and redirect path', async () => {
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({ data: {}, error: null } as any)
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await result.current.signInWithGoogle() })
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: expect.stringContaining('/seriestracker/') },
    })
  })

  it('signInWithGitHub calls signInWithOAuth with github provider and redirect path', async () => {
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({ data: {}, error: null } as any)
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await result.current.signInWithGitHub() })
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'github',
      options: { redirectTo: expect.stringContaining('/seriestracker/') },
    })
  })

  it('signOut delegates to supabase.auth.signOut', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await result.current.signOut() })
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1)
  })
})
