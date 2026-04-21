import { describe, it, expect, vi, beforeEach } from 'vitest'
import useAuthStore from '../authStore'
import authService from '../../services/authService'

// Mock the auth service
vi.mock('../../services/authService', () => ({
  default: {
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    isLoggedIn: vi.fn(),
    getProfile: vi.fn(),
  },
}))

describe('Auth Store', () => {
  beforeEach(() => {
    // Clear mocks and reset store
    vi.clearAllMocks()
    useAuthStore.getState().logout()
    localStorage.clear()
  })

  it('initializes with correct default state', () => {
    const state = useAuthStore.getState()
    
    expect(state.user).toBeNull()
    expect(state.isLoading).toBeFalsy()
    expect(state.error).toBeNull()
    expect(state.isAuthenticated).toBeFalsy()
  })

  it('login updates auth state correctly on success', async () => {
    // Mock successful login and profile fetch
    const mockToken = { access_token: 'test-token', token_type: 'bearer', user_id: '123' }
    const mockUser = { id: '123', username: 'testuser', email: 'test@example.com' }
    
    vi.mocked(authService.login).mockResolvedValueOnce(mockToken)
    vi.mocked(authService.getProfile).mockResolvedValueOnce(mockUser)
    
    // Call login
    await useAuthStore.getState().login('test@example.com', 'password')
    
    // Check state updates
    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBeTruthy()
    expect(state.isLoading).toBeFalsy()
    expect(state.error).toBeNull()
    
    // Verify service calls
    expect(authService.login).toHaveBeenCalledWith({ 
      username: 'test@example.com', 
      password: 'password' 
    })
    expect(authService.getProfile).toHaveBeenCalled()
  })

  it('login updates error state on failure', async () => {
    // Mock failed login
    const mockError = new Error('Invalid credentials')
    vi.mocked(authService.login).mockRejectedValueOnce(mockError)
    
    // Call login
    await useAuthStore.getState().login('test@example.com', 'wrong-password')
    
    // Check state updates
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBeFalsy()
    expect(state.isLoading).toBeFalsy()
    expect(state.error).toBe('Invalid credentials')
  })

  it('signup followed by login updates auth state correctly', async () => {
    // Mock successful signup, login, and profile fetch
    const mockSignupResponse = { access_token: 'signup-token', token_type: 'bearer', user_id: '123' }
    const mockLoginToken = { access_token: 'login-token', token_type: 'bearer', user_id: '123' }
    const mockUserProfile = { id: '123', username: 'newuser', email: 'new@example.com', phone: '1234567890' }
    
    vi.mocked(authService.signup).mockResolvedValueOnce(mockSignupResponse)
    vi.mocked(authService.login).mockResolvedValueOnce(mockLoginToken)
    vi.mocked(authService.getProfile).mockResolvedValueOnce(mockUserProfile)
    
    // Call signup
    await useAuthStore.getState().signup('new@example.com', 'password')
    
    // Check state updates
    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUserProfile)
    expect(state.isAuthenticated).toBeTruthy()
    expect(state.isLoading).toBeFalsy()
    expect(state.error).toBeNull()
    
    // Verify service calls
    expect(authService.signup).toHaveBeenCalledWith({ 
      email: 'new@example.com', 
      password: 'password',
      phone: '1234567890'
    })
    expect(authService.login).toHaveBeenCalled()
    expect(authService.getProfile).toHaveBeenCalled()
  })

  it('logout clears the auth state', () => {
    // Set up authenticated state first
    useAuthStore.setState({
      user: { id: '123', username: 'testuser', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
      error: null
    })
    
    // Call logout
    useAuthStore.getState().logout()
    
    // Check state updates
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBeFalsy()
    expect(authService.logout).toHaveBeenCalled()
  })

  it('loadUser fetches user profile if token exists', async () => {
    // Mock token and user profile
    vi.mocked(authService.isLoggedIn).mockReturnValueOnce(true)
    const mockUser = { id: '123', username: 'testuser', email: 'test@example.com' }
    vi.mocked(authService.getProfile).mockResolvedValueOnce(mockUser)
    
    // Call loadUser
    await useAuthStore.getState().loadUser()
    
    // Check state updates
    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBeTruthy()
    expect(state.isLoading).toBeFalsy()
    expect(state.error).toBeNull()
  })

  it('loadUser clears state if token does not exist', async () => {
    // Set up authenticated state first
    useAuthStore.setState({
      user: { id: '123', username: 'testuser', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
      error: null
    })
    
    // Mock no token
    vi.mocked(authService.isLoggedIn).mockReturnValueOnce(false)
    
    // Call loadUser
    await useAuthStore.getState().loadUser()
    
    // Check state updates
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBeFalsy()
    
    // getProfile should not be called
    expect(authService.getProfile).not.toHaveBeenCalled()
  })
}) 