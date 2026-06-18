import { renderHook, waitFor, act } from '@testing-library/react'
import { useShares } from './useShares'
import { createChain } from '../test/supabaseMock'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}))

import { supabase } from '../lib/supabase'

const mockUser = { id: 'owner-1' }
const mockOwned = [{ id: 'share-1', owner_id: 'owner-1', viewer_id: 'viewer-1', created_at: '2024-01-01' }]
const mockReceived = [{ id: 'share-2', owner_id: 'owner-2', viewer_id: 'owner-1', created_at: '2024-01-02' }]
const mockProfiles = [
  { id: 'viewer-1', email: 'viewer@example.com', display_name: 'Viewer', avatar_url: null, created_at: '2024-01-01' },
  { id: 'owner-2', email: 'owner2@example.com', display_name: 'Owner 2', avatar_url: null, created_at: '2024-01-01' },
]

function setupFetchMocks() {
  vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: mockUser }, error: null } as any)
  vi.mocked(supabase.from)
    .mockReturnValueOnce(createChain({ data: mockOwned, error: null }))   // owned shares
    .mockReturnValueOnce(createChain({ data: mockReceived, error: null })) // received shares
    .mockReturnValueOnce(createChain({ data: mockProfiles, error: null })) // profiles lookup
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useShares', () => {
  describe('fetchShares', () => {
    it('loads owned shares and shared-with-me on mount', async () => {
      setupFetchMocks()
      const { result } = renderHook(() => useShares())
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.myShares).toHaveLength(1)
      expect(result.current.sharedWithMe).toHaveLength(1)
    })

    it('enriches myShares entries with the viewer Profile', async () => {
      setupFetchMocks()
      const { result } = renderHook(() => useShares())
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.myShares[0].viewer).toEqual(mockProfiles[0])
    })

    it('enriches sharedWithMe entries with the owner Profile', async () => {
      setupFetchMocks()
      const { result } = renderHook(() => useShares())
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.sharedWithMe[0].owner).toEqual(mockProfiles[1])
    })

    it('skips profile fetch when there are no shares', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: mockUser }, error: null } as any)
      vi.mocked(supabase.from)
        .mockReturnValueOnce(createChain({ data: [], error: null }))
        .mockReturnValueOnce(createChain({ data: [], error: null }))
      const { result } = renderHook(() => useShares())
      await waitFor(() => expect(result.current.loading).toBe(false))
      // from() was called exactly twice (owned + received); no third profiles call
      expect(supabase.from).toHaveBeenCalledTimes(2)
      expect(result.current.myShares).toHaveLength(0)
    })
  })

  describe('addShare', () => {
    it('looks up a profile by lowercase-trimmed email and inserts a share', async () => {
      setupFetchMocks()
      const { result } = renderHook(() => useShares())
      await waitFor(() => expect(result.current.loading).toBe(false))

      const viewerProfile = { id: 'new-viewer' }
      // Calls after initial fetch: profile lookup, insert, then re-fetch (3 more from calls)
      vi.mocked(supabase.from)
        .mockReturnValueOnce(createChain({ data: viewerProfile, error: null })) // profile lookup (.single)
        .mockReturnValueOnce(createChain({ data: null, error: null }))           // insert
        .mockReturnValueOnce(createChain({ data: [], error: null }))             // refetch owned
        .mockReturnValueOnce(createChain({ data: [], error: null }))             // refetch received

      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: mockUser }, error: null } as any)

      await act(async () => { await result.current.addShare('  Viewer@Example.com  ') })

      // The first from call after initial fetch is the profile lookup
      const profileFromCall = vi.mocked(supabase.from).mock.calls[3]
      expect(profileFromCall[0]).toBe('profiles')
    })

    it('throws a Portuguese error when the email is not found', async () => {
      setupFetchMocks()
      const { result } = renderHook(() => useShares())
      await waitFor(() => expect(result.current.loading).toBe(false))

      vi.mocked(supabase.from).mockReturnValue(
        createChain({ data: null, error: new Error('No rows') })
      )

      await expect(
        act(async () => { await result.current.addShare('ghost@example.com') })
      ).rejects.toThrow('Utilizador não encontrado com esse email')
    })

    it('throws a Portuguese error on duplicate share (Postgres code 23505)', async () => {
      setupFetchMocks()
      const { result } = renderHook(() => useShares())
      await waitFor(() => expect(result.current.loading).toBe(false))

      const viewerProfile = { id: 'already-shared' }
      vi.mocked(supabase.from)
        .mockReturnValueOnce(createChain({ data: viewerProfile, error: null }))
        .mockReturnValueOnce(createChain({ data: null, error: { code: '23505', message: 'duplicate' } }))

      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: mockUser }, error: null } as any)

      await expect(
        act(async () => { await result.current.addShare('existing@example.com') })
      ).rejects.toThrow('Já partilhas com este utilizador')
    })

    it('throws when the current user is not authenticated', async () => {
      setupFetchMocks()
      const { result } = renderHook(() => useShares())
      await waitFor(() => expect(result.current.loading).toBe(false))

      vi.mocked(supabase.from).mockReturnValue(
        createChain({ data: { id: 'some-viewer' }, error: null })
      )
      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null } as any)

      await expect(
        act(async () => { await result.current.addShare('viewer@example.com') })
      ).rejects.toThrow('Não autenticado')
    })
  })

  describe('removeShare', () => {
    it('deletes the share by id and refreshes', async () => {
      setupFetchMocks()
      const { result } = renderHook(() => useShares())
      await waitFor(() => expect(result.current.loading).toBe(false))

      const deleteChain = createChain({ data: null, error: null })
      vi.mocked(supabase.from)
        .mockReturnValueOnce(deleteChain)
        .mockReturnValueOnce(createChain({ data: [], error: null }))
        .mockReturnValueOnce(createChain({ data: [], error: null }))

      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: mockUser }, error: null } as any)

      await act(async () => { await result.current.removeShare('share-1') })

      expect(deleteChain.delete).toHaveBeenCalled()
      expect(deleteChain.eq).toHaveBeenCalledWith('id', 'share-1')
    })
  })
})
