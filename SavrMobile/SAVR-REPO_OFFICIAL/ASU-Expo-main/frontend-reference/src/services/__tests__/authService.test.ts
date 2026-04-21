import { describe, it, expect, vi, beforeEach } from 'vitest'
import authService from '../authService'
import api from '../api'

// Mock the api
vi.mock('../api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('signup sends correct data and returns user response', async () => {
    // Mock data
    const signupData = {
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      username: 'test@example.com',
      first_name: 'Test',
      last_name: 'User'
    }
    
    const mockResponse = {
      data: {
        id: '123',
        email: 'test@example.com',
        phone: '1234567890',
        is_active: true,
        created_at: '2023-01-01T00:00:00'
      }
    }
    
    // Mock API response
    vi.mocked(api.post).mockResolvedValueOnce(mockResponse)
    
    // Call signup
    const result = await authService.signup(signupData)
    
    // Check result
    expect(result).toEqual(mockResponse.data)
    
    // Check API call
    expect(api.post).toHaveBeenCalledWith('/auth/signup', signupData)
  })

  it('login sends correct data, stores token, and returns auth response', async () => {
    // Mock data
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    }
    
    const mockResponse = {
      data: {
        access_token: 'test-token',
        token_type: 'bearer'
      }
    }
    
    // Mock API response
    vi.mocked(api.post).mockResolvedValueOnce(mockResponse)
    
    // Call login
    const result = await authService.login(loginData)
    
    // Check result
    expect(result).toEqual(mockResponse.data)
    
    // Check API call
    expect(api.post).toHaveBeenCalledWith(
      '/auth/login',
      expect.any(FormData),
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    )
    
    // Check if token was stored
    expect(localStorage.getItem('token')).toBe('test-token')
  })

  it('logout removes token from localStorage', () => {
    // Set token in localStorage
    localStorage.setItem('token', 'test-token')
    
    // Call logout
    authService.logout()
    
    // Check if token was removed
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('isLoggedIn returns true when token exists', () => {
    // Set token in localStorage
    localStorage.setItem('token', 'test-token')
    
    // Check result
    expect(authService.isLoggedIn()).toBeTruthy()
  })

  it('isLoggedIn returns false when token does not exist', () => {
    // Ensure no token in localStorage
    localStorage.removeItem('token')
    
    // Check result
    expect(authService.isLoggedIn()).toBeFalsy()
  })

  it('getProfile sends request with auth token and returns user data', async () => {
    // Mock response
    const mockResponse = {
      data: {
        id: '123',
        email: 'test@example.com',
        phone: null,
        is_active: true,
        created_at: '2023-01-01T00:00:00'
      }
    }
    
    // Mock API response
    vi.mocked(api.get).mockResolvedValueOnce(mockResponse)
    
    // Call getProfile
    const result = await authService.getProfile()
    
    // Check result
    expect(result).toEqual(mockResponse.data)
    
    // Check API call
    expect(api.get).toHaveBeenCalledWith('/auth/profile')
  })
}) 