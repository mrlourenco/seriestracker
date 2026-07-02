import { renderHook, waitFor, act } from '@testing-library/react'
import { useSeries } from './useSeries'
import { createChain } from '../test/supabaseMock'
import type { Series } from '../types'

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
  genres: null,
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
