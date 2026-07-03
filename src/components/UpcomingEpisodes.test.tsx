import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import UpcomingEpisodes from './UpcomingEpisodes'
import type { Series } from '../types'

// The component renders <Link>, which needs a Router in scope
function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

const base: Series = {
  id: '1',
  user_id: 'u1',
  title: 'Test Show',
  poster_url: null,
  status: 'watching',
  platform: 'Netflix',
  genres: null,
  current_season: 1,
  current_episode: 1,
  rating: null,
  notes: null,
  next_episode_date: null,
  next_episode_season: null,
  next_episode_number: null,
  next_episode_title: null,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

function makeSeries(overrides: Partial<Series> = {}): Series {
  return { ...base, ...overrides }
}

// Fix today to 2026-06-18 for deterministic date tests
const TODAY = '2026-06-18'
beforeAll(() => { vi.useFakeTimers() })
beforeEach(() => { vi.setSystemTime(new Date(TODAY + 'T12:00:00')) })
afterAll(() => { vi.useRealTimers() })

describe('UpcomingEpisodes', () => {
  it('renders nothing when no series have a next_episode_date', () => {
    const { container } = renderWithRouter(<UpcomingEpisodes series={[makeSeries()]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the series array is empty', () => {
    const { container } = renderWithRouter(<UpcomingEpisodes series={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows a series title when it has a future next_episode_date', () => {
    const series = makeSeries({ next_episode_date: '2026-06-25' })
    renderWithRouter(<UpcomingEpisodes series={[series]} />)
    expect(screen.getByText('Test Show')).toBeInTheDocument()
  })

  it('shows the "HOJE" badge for an episode airing today', () => {
    const series = makeSeries({ next_episode_date: TODAY })
    renderWithRouter(<UpcomingEpisodes series={[series]} />)
    expect(screen.getByText('HOJE')).toBeInTheDocument()
  })

  it('shows the "Xd" badge for episodes within 7 days', () => {
    const series = makeSeries({ next_episode_date: '2026-06-21' }) // 3 days from now
    renderWithRouter(<UpcomingEpisodes series={[series]} />)
    expect(screen.getByText('3d')).toBeInTheDocument()
  })

  it('shows the "PASSOU" badge for episodes in the past', () => {
    const series = makeSeries({ next_episode_date: '2026-06-10' })
    renderWithRouter(<UpcomingEpisodes series={[series]} />)
    expect(screen.getByText('PASSOU')).toBeInTheDocument()
  })

  it('does not show a badge for episodes more than 7 days away', () => {
    const series = makeSeries({ next_episode_date: '2026-07-30' })
    renderWithRouter(<UpcomingEpisodes series={[series]} />)
    expect(screen.queryByText(/HOJE|^\d+d$|PASSOU/)).toBeNull()
  })

  it('sorts upcoming episodes by date ascending', () => {
    const series = [
      makeSeries({ id: '1', title: 'Later Show', next_episode_date: '2026-06-25' }),
      makeSeries({ id: '2', title: 'Earlier Show', next_episode_date: '2026-06-20' }),
    ]
    renderWithRouter(<UpcomingEpisodes series={series} />)
    const items = screen.getAllByText(/Show/)
    expect(items[0].textContent).toBe('Earlier Show')
    expect(items[1].textContent).toBe('Later Show')
  })

  it('limits to 10 items even when more are provided', () => {
    const series = Array.from({ length: 15 }, (_, i) =>
      makeSeries({ id: String(i), title: `Show ${i}`, next_episode_date: `2026-07-${String(i + 1).padStart(2, '0')}` })
    )
    renderWithRouter(<UpcomingEpisodes series={series} />)
    expect(screen.getAllByText(/^Show \d+$/).length).toBe(10)
  })

  it('displays season and episode info when present', () => {
    const series = makeSeries({
      next_episode_date: '2026-06-25',
      next_episode_season: 3,
      next_episode_number: 7,
      next_episode_title: 'The Finale',
    })
    renderWithRouter(<UpcomingEpisodes series={[series]} />)
    expect(screen.getByText(/T3/)).toBeInTheDocument()
    expect(screen.getByText(/Ep 7/)).toBeInTheDocument()
    expect(screen.getByText(/The Finale/)).toBeInTheDocument()
  })

  it('renders a poster image when poster_url is provided', () => {
    const series = makeSeries({
      next_episode_date: '2026-06-25',
      poster_url: 'https://example.com/poster.jpg',
    })
    renderWithRouter(<UpcomingEpisodes series={[series]} />)
    const img = screen.getByRole('img', { name: 'Test Show' })
    expect(img).toHaveAttribute('src', 'https://example.com/poster.jpg')
  })
})
