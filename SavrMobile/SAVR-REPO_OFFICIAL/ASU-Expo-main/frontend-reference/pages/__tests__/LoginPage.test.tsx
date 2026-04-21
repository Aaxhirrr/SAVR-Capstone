import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/utils'
import LoginPage from '../LoginPage'
import useAuthStore from '../../stores/authStore'

// Mock the auth store
vi.mock('../../stores/authStore')

describe('LoginPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.mocked(useAuthStore).mockReturnValue({
      login: vi.fn(),
      isLoading: false,
      error: null
    } as any)
  })

  it('renders login form correctly', () => {
    renderWithProviders(<LoginPage />)
    
    // Check heading
    expect(screen.getByText('Savr')).toBeInTheDocument()
    expect(screen.getByText('Enter your email and password to log in')).toBeInTheDocument()
    
    // Check form fields
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    
    // Check submit button
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
    
    // Check signup link
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
    expect(screen.getByText('Sign up')).toBeInTheDocument()
    expect(screen.getByText('Sign up')).toHaveAttribute('href', '/signup')
  })

  it('displays error message when provided', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      login: vi.fn(),
      isLoading: false,
      error: 'Invalid credentials'
    } as any)
    
    renderWithProviders(<LoginPage />)
    
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })

  it('disables button and shows loading state when isLoading is true', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      login: vi.fn(),
      isLoading: true,
      error: null
    } as any)
    
    renderWithProviders(<LoginPage />)
    
    const button = screen.getByRole('button', { name: /logging in/i })
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Logging in...')
  })

  it('submits the form with entered data', async () => {
    const mockLogin = vi.fn()
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null
    } as any)
    
    renderWithProviders(<LoginPage />)
    
    // Fill form
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    await userEvent.type(emailInput, 'test@example.com')
    await userEvent.type(passwordInput, 'password123')
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /log in/i })
    await userEvent.click(submitButton)
    
    // Check if login was called with correct data
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('validates required fields', async () => {
    const mockLogin = vi.fn()
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null
    } as any)
    
    renderWithProviders(<LoginPage />)
    
    // Submit form without filling any fields
    const submitButton = screen.getByRole('button', { name: /log in/i })
    await userEvent.click(submitButton)
    
    // Check if login was not called
    expect(mockLogin).not.toHaveBeenCalled()
    
    // Check for HTML5 validation message (this is browser-dependent)
    // Note: jsdom doesn't fully support validation, but we can check the required attribute
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    expect(emailInput).toHaveAttribute('required')
    expect(passwordInput).toHaveAttribute('required')
  })
}) 