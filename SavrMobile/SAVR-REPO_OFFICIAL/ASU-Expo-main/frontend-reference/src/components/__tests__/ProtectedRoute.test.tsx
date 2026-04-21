import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { renderWithProviders } from '../../test/utils'
import ProtectedRoute from '../ProtectedRoute'
import useAuthStore from '../../stores/authStore'

// Mock the auth store
vi.mock('../../stores/authStore')

describe('ProtectedRoute', () => {
  // Reset mocks before each test if needed
  // beforeEach(() => {
  //   vi.clearAllMocks();
  //   // Reset store state if necessary
  //   useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false }); 
  // });

  it('renders loading state when isLoading is true', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null // Added for completeness
    } as any)
    
    renderWithProviders(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<ProtectedRoute><div data-testid="loading-child">Loading Content</div></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    )
    
    // Should show loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByTestId('loading-child')).not.toBeInTheDocument()
  })

  it('redirects to login when user is not authenticated', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null // Added for completeness
    } as any)
    
    renderWithProviders(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/protected" element={<ProtectedRoute><div data-testid="protected-content">Protected Content</div></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    )
    
    // Should redirect to login page
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('renders the protected content when user is authenticated', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', username: 'test' } // Added basic user
    } as any)
    
    renderWithProviders(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
           <Route path="/protected" element={<ProtectedRoute><div data-testid="protected-content">Protected Content</div></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    )
    
    // Should show protected content
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  // Note: Role checking logic within ProtectedRoute itself needs to be implemented
  // These tests assume a basic implementation exists or will be added.
  it('renders content when user is authenticated and has required role (basic test)', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', username: 'admin', roles: ['admin'] } // Mock user with role
    } as any)

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><div data-testid="admin-content">Admin Content</div></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId('admin-content')).toBeInTheDocument()
  })

  it('redirects to unauthorized when user is authenticated but lacks required role (basic test)', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '2', username: 'user', roles: ['user'] } // Mock user without admin role
    } as any)

    renderWithProviders(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><div data-testid="admin-content">Admin Content</div></ProtectedRoute>} />
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        </Routes>
      </MemoryRouter>
    )

    // Assuming ProtectedRoute redirects to /unauthorized or renders an unauthorized component
    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument()
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
  })

}) // Added missing closing brace and parenthesis 