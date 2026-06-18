import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SeriesCard from './SeriesCard'
import type { Series } from '../types'

const base: Series = {
  id: '1',
  user_id: 'u1',
  title: 'Breaking Bad',
  poster_url: null,
  status: 'watching',
  platform: 'Netflix',
  current_season: 3,
  current_episode: 6,
  rating: 10,
  notes: null,
  next_episode_date: null,
  next_episode_season: null,
  next_episode_number: null,
  next_episode_title: null,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

function renderCard(props: Partial<Parameters<typeof SeriesCard>[0]> = {}) {
  return render(
    <MemoryRouter>
      <SeriesCard series={base} {...props} />
    </MemoryRouter>
  )
}

describe('SeriesCard', () => {
  it('renders title, status badge and platform badge', () => {
    renderCard()
    expect(screen.getByText('Breaking Bad')).toBeInTheDocument()
    expect(screen.getByText('A ver')).toBeInTheDocument()
    expect(screen.getByText('Netflix')).toBeInTheDocument()
  })

  it('does not show an owner badge by default', () => {
    renderCard()
    // no indigo badge
    expect(screen.queryByText(/^[A-Z]/i, { selector: '.border-indigo-800' })).not.toBeInTheDocument()
  })

  it('shows the owner badge when ownerName is provided', () => {
    renderCard({ ownerName: 'Ana' })
    expect(screen.getByText('Ana')).toBeInTheDocument()
  })

  it('links to the series detail page', () => {
    renderCard()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/series/1')
  })

  it('shows season and episode info', () => {
    renderCard()
    expect(screen.getByText(/T3/)).toBeInTheDocument()
    expect(screen.getByText(/Ep 6/)).toBeInTheDocument()
  })

  it('renders a poster image when poster_url is set', () => {
    renderCard({ series: { ...base, poster_url: 'https://example.com/poster.jpg' } })
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/poster.jpg')
  })
})
