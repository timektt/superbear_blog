import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from '@/components/ui/SearchBar'

describe('SearchBar', () => {
  const mockOnSearch = jest.fn()
  const mockOnClear = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render search input with placeholder', () => {
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />)

    const input = screen.getByPlaceholderText('Search articles...')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'search')
  })

  it('should call onSearch when user types', async () => {
    const user = userEvent.setup()
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />)

    const input = screen.getByPlaceholderText('Search articles...')
    await user.type(input, 'React')

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('React')
    })
  })

  it('should debounce search calls', async () => {
    const user = userEvent.setup()
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />)

    const input = screen.getByPlaceholderText('Search articles...')
    
    // Type quickly
    await user.type(input, 'React')
    
    // Should not call immediately
    expect(mockOnSearch).not.toHaveBeenCalled()

    // Wait for debounce
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('React')
    }, { timeout: 1000 })

    expect(mockOnSearch).toHaveBeenCalledTimes(1)
  })

  it('should show clear button when there is text', async () => {
    const user = userEvent.setup()
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />)

    const input = screen.getByPlaceholderText('Search articles...')
    
    // Initially no clear button
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument()

    await user.type(input, 'React')

    // Clear button should appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
    })
  })

  it('should clear search when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />)

    const input = screen.getByPlaceholderText('Search articles...')
    await user.type(input, 'React')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
    })

    const clearButton = screen.getByRole('button', { name: /clear/i })
    await user.click(clearButton)

    expect(mockOnClear).toHaveBeenCalled()
    expect(input).toHaveValue('')
  })

  it('should handle Enter key press', async () => {
    const user = userEvent.setup()
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />)

    const input = screen.getByPlaceholderText('Search articles...')
    await user.type(input, 'React')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('React')
    })
  })

  it('should have proper accessibility attributes', () => {
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />)

    const input = screen.getByPlaceholderText('Search articles...')
    expect(input).toHaveAttribute('aria-label', 'Search articles')
    expect(input).toHaveAttribute('role', 'searchbox')
  })

  it('should handle controlled value prop', () => {
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} value="Initial value" />)

    const input = screen.getByPlaceholderText('Search articles...')
    expect(input).toHaveValue('Initial value')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} disabled />)

    const input = screen.getByPlaceholderText('Search articles...')
    expect(input).toBeDisabled()
  })

  it('should show loading state', () => {
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} loading />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Searching...')).toBeInTheDocument()
  })

  it('should handle empty search gracefully', async () => {
    const user = userEvent.setup()
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />)

    const input = screen.getByPlaceholderText('Search articles...')
    await user.type(input, 'React')
    await user.clear(input)

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('')
    })
  })
})