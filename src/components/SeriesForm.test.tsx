import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SeriesForm from './SeriesForm'
import type { Series } from '../types'

const mockOnSubmit = vi.fn()
const mockOnCancel = vi.fn()

const existingSeries: Series = {
  id: 'series-1',
  user_id: 'user-1',
  title: 'Breaking Bad',
  poster_url: 'https://example.com/poster.jpg',
  status: 'watching',
  platform: 'Netflix',
  current_season: 3,
  current_episode: 6,
  rating: 10,
  notes: 'Best show ever',
  next_episode_date: '2026-07-01',
  next_episode_season: 4,
  next_episode_number: 1,
  next_episode_title: 'Box Cutter',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockOnSubmit.mockResolvedValue(undefined)
})

describe('SeriesForm', () => {
  describe('empty form', () => {
    it('renders with default empty values and "Para ver" status', () => {
      render(<SeriesForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      expect(screen.getByPlaceholderText('Nome da série')).toHaveValue('')
      expect(screen.getByDisplayValue('Para ver')).toBeInTheDocument()
    })

    it('does not show the next episode section by default', () => {
      render(<SeriesForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      expect(screen.queryByText('Data de estreia')).not.toBeInTheDocument()
    })
  })

  describe('pre-filled form', () => {
    it('pre-fills all fields from the initial series', () => {
      render(<SeriesForm initial={existingSeries} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      expect(screen.getByDisplayValue('Breaking Bad')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Netflix')).toBeInTheDocument()
      expect(screen.getByDisplayValue('10')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Best show ever')).toBeInTheDocument()
    })

    it('expands the next episode section when initial data has a next_episode_date', () => {
      render(<SeriesForm initial={existingSeries} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      expect(screen.getByText('Data de estreia')).toBeInTheDocument()
    })
  })

  describe('validation', () => {
    it('shows a Portuguese required-title error when form is submitted without a title', () => {
      // Use fireEvent.submit to bypass jsdom's native HTML5 required-field validation
      // so React's handleSubmit runs and sets the error state.
      const { container } = render(<SeriesForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      fireEvent.submit(container.querySelector('form')!)
      expect(screen.getByText('O título é obrigatório')).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('shows a required-title error when title is only whitespace', async () => {
      const user = userEvent.setup()
      render(<SeriesForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      await user.type(screen.getByPlaceholderText('Nome da série'), '   ')
      await user.click(screen.getByRole('button', { name: 'Guardar' }))
      expect(screen.getByText('O título é obrigatório')).toBeInTheDocument()
    })
  })

  describe('submission', () => {
    it('calls onSubmit with the form data when title is provided', async () => {
      const user = userEvent.setup()
      render(<SeriesForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      await user.type(screen.getByPlaceholderText('Nome da série'), 'The Wire')
      await user.click(screen.getByRole('button', { name: 'Guardar' }))
      await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1))
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'The Wire' })
      )
    })

    it('shows a saving state while the submit is in progress', async () => {
      let resolve: () => void
      mockOnSubmit.mockReturnValue(new Promise<void>(r => { resolve = r }))
      const user = userEvent.setup()
      render(<SeriesForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      await user.type(screen.getByPlaceholderText('Nome da série'), 'Test')
      await user.click(screen.getByRole('button', { name: 'Guardar' }))
      expect(screen.getByRole('button', { name: 'A guardar...' })).toBeDisabled()
      resolve!()
    })

    it('shows an error message when onSubmit rejects', async () => {
      mockOnSubmit.mockRejectedValue(new Error('Server error'))
      const user = userEvent.setup()
      render(<SeriesForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      await user.type(screen.getByPlaceholderText('Nome da série'), 'Test')
      await user.click(screen.getByRole('button', { name: 'Guardar' }))
      await waitFor(() => expect(screen.getByText('Server error')).toBeInTheDocument())
    })

    it('shows a fallback error message when onSubmit rejects with a non-Error', async () => {
      mockOnSubmit.mockRejectedValue('unexpected')
      const user = userEvent.setup()
      render(<SeriesForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      await user.type(screen.getByPlaceholderText('Nome da série'), 'Test')
      await user.click(screen.getByRole('button', { name: 'Guardar' }))
      await waitFor(() => expect(screen.getByText('Erro ao guardar')).toBeInTheDocument())
    })
  })

  describe('next episode section', () => {
    it('toggles the next episode section when the button is clicked', async () => {
      const user = userEvent.setup()
      render(<SeriesForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      expect(screen.queryByText('Data de estreia')).not.toBeInTheDocument()
      await user.click(screen.getByText('Próximo episódio'))
      expect(screen.getByText('Data de estreia')).toBeInTheDocument()
      await user.click(screen.getByText('Próximo episódio'))
      expect(screen.queryByText('Data de estreia')).not.toBeInTheDocument()
    })
  })

  describe('cancel', () => {
    it('calls onCancel when the cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<SeriesForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      await user.click(screen.getByRole('button', { name: 'Cancelar' }))
      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })
  })
})
