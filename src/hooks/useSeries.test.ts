import { renderHook, waitFor, act } from '@testing-library/react'
import { useSeries } from './useSeries'
import { createChain } from '../test/supabaseMock'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}))

import { supabase } from '../lib/supabase'

const mockUser = { id: 'user-1' }
const makeSeries = (overrides = {}) => ({
  id: '1',
  user_id: 'user-1',
  title: 'Breaking Bad',
  poster_url: null,
  status: 'watching' as const,
  platform: 'Netflix' as const,
  current_season: 1,
  current_episode: 5,
  rating: 9,
  notes: null,
  next_episode_date: null,
  next_episode_season: null,
  next_episode_number: null,
  next_episode_title: null,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: mockUser }, error: null } as any)
  vi.mocked(supabase.from).mockReturnValue(createChain({ data: [], error: null }))
})

describe('useSeries', () => {
  describe('fetchSeries', () => {
    it('does not call the API and stays loading when userId is null', async () => {
      const { result } = renderHook(() => useSeries({ userId: null }))
      // Give the effect time to run
      await act(async () => {})
      expect(result.current.loading).toBe(true)
      expect(supabase.from).not.toHaveBeenCalled()
    })

    it('does not call the API and stays loading when userIds is empty', async () => {
      const { result } = renderHook(() => useSeries({ userIds: [] }))
      await act(async () => {})
      expect(result.current.loading).toBe(true)
      expect(supabase.from).not.toHaveBeenCalled()
    })

    it('fetches series for multiple userIds using .in()', async () => {
      const series = [makeSeries({ user_id: 'user-1' }), makeSeries({ id: '2', user_id: 'user-2' })]
      const chain = createChain({ data: series, error: null })
      vi.mocked(supabase.from).mockReturnValue(chain)
      const { result } = renderHook(() => useSeries({ userIds: ['user-1', 'user-2'] }))
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.series).toEqual(series)
      expect(chain.in).toHaveBeenCalledWith('user_id', ['user-1', 'user-2'])
    })

    it('fetches series for a given userId and sets state', async () => {
      const series = [makeSeries()]
      vi.mocked(supabase.from).mockReturnValue(createChain({ data: series, error: null }))
      const { result } = renderHook(() => useSeries({ userId: 'user-1' }))
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.series).toEqual(series)
      expect(result.current.error).toBeNull()
      expect(supabase.from).toHaveBeenCalledWith('series')
    })

    it('applies status filter on the query chain', async () => {
      const chain = createChain({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(chain)
      const { result } = renderHook(() => useSeries({ userId: 'user-1', status: 'watching' }))
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(chain.eq).toHaveBeenCalledWith('status', 'watching')
    })

    it('applies platform filter on the query chain', async () => {
      const chain = createChain({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(chain)
      const { result } = renderHook(() => useSeries({ userId: 'user-1', platform: 'Netflix' }))
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(chain.eq).toHaveBeenCalledWith('platform', 'Netflix')
    })

    it('applies ilike search filter on the query chain', async () => {
      const chain = createChain({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(chain)
      const { result } = renderHook(() => useSeries({ userId: 'user-1', search: 'break' }))
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(chain.ilike).toHaveBeenCalledWith('title', '%break%')
    })

    it('sets error message when the query fails', async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createChain({ data: null, error: new Error('Network error') })
      )
      const { result } = renderHook(() => useSeries({ userId: 'user-1' }))
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.error).toBe('Network error')
      expect(result.current.series).toEqual([])
    })

    it('uses fallback error message when error is not an Error instance', async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createChain({ data: null, error: 'some string error' })
      )
      const { result } = renderHook(() => useSeries({ userId: 'user-1' }))
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.error).toBe('Erro ao carregar séries')
    })
  })

  describe('addSeries', () => {
    it('inserts a new series with the current user id', async () => {
      const chain = createChain({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(chain)
      const { result } = renderHook(() => useSeries({ userId: 'user-1' }))
      await waitFor(() => expect(result.current.loading).toBe(false))

      const newSeries = makeSeries({ id: undefined, user_id: undefined })
      await act(async () => { await result.current.addSeries(newSeries) })

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'user-1' })
      )
    })

    it('throws when the user is not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null } as any)
      const { result } = renderHook(() => useSeries({ userId: 'user-1' }))
      await waitFor(() => expect(result.current.loading).toBe(false))

      await expect(
        act(async () => { await result.current.addSeries(makeSeries()) })
      ).rejects.toThrow('Não autenticado')
    })

    it('propagates a database error from insert', async () => {
      const fetchChain = createChain({ data: [], error: null })
      const insertChain = createChain({ data: null, error: new Error('Duplicate title') })
      vi.mocked(supabase.from)
        .mockReturnValueOnce(fetchChain) // initial fetch
        .mockReturnValue(insertChain)   // insert call
      const { result } = renderHook(() => useSeries({ userId: 'user-1' }))
      await waitFor(() => expect(result.current.loading).toBe(false))

      await expect(
        act(async () => { await result.current.addSeries(makeSeries()) })
      ).rejects.toThrow('Duplicate title')
    })
  })

  describe('updateSeries', () => {
    it('calls update with the given fields and refreshes the list', async () => {
      const chain = createChain({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(chain)
      const { result } = renderHook(() => useSeries({ userId: 'user-1' }))
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => { await result.current.updateSeries('1', { title: 'New Title' }) })

      expect(chain.update).toHaveBeenCalledWith({ title: 'New Title' })
      expect(chain.eq).toHaveBeenCalledWith('id', '1')
    })
  })

  describe('deleteSeries', () => {
    it('calls delete with the series id and refreshes the list', async () => {
      const chain = createChain({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(chain)
      const { result } = renderHook(() => useSeries({ userId: 'user-1' }))
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => { await result.current.deleteSeries('1') })

      expect(chain.delete).toHaveBeenCalled()
      expect(chain.eq).toHaveBeenCalledWith('id', '1')
    })
  })

  describe('getById', () => {
    it('returns a series when found', async () => {
      const series = makeSeries()
      const fetchChain = createChain({ data: [], error: null })
      const getByIdChain = createChain({ data: series, error: null })
      vi.mocked(supabase.from)
        .mockReturnValueOnce(fetchChain)
        .mockReturnValue(getByIdChain)
      const { result } = renderHook(() => useSeries({ userId: 'user-1' }))
      await waitFor(() => expect(result.current.loading).toBe(false))

      let found: ReturnType<typeof makeSeries> | null = null
      await act(async () => { found = await result.current.getById('1') })

      expect(found).toEqual(series)
      expect(getByIdChain.single).toHaveBeenCalled()
    })

    it('returns null when the query errors', async () => {
      const fetchChain = createChain({ data: [], error: null })
      const getByIdChain = createChain({ data: null, error: new Error('Not found') })
      vi.mocked(supabase.from)
        .mockReturnValueOnce(fetchChain)
        .mockReturnValue(getByIdChain)
      const { result } = renderHook(() => useSeries({ userId: 'user-1' }))
      await waitFor(() => expect(result.current.loading).toBe(false))

      let found: unknown = 'sentinel'
      await act(async () => { found = await result.current.getById('missing') })

      expect(found).toBeNull()
    })
  })
})
