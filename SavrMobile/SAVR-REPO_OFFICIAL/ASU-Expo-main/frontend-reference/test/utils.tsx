import { ReactElement, PropsWithChildren } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import ThemeProvider from '@/components/ThemeProvider'

// Create a custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string
}

// Helper component to provide all contexts
const AllTheProviders = ({ children }: PropsWithChildren<{}>): ReactElement => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </BrowserRouter>
  );
};

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { route = '', ...renderOptions } = options

  // Set up the URL before rendering if a route is provided
  if (route) {
    window.history.pushState({}, 'Test page', route)
  }

  // Return an object with all of the render methods, using AllTheProviders as the wrapper
  return {
    ...render(ui, {
      wrapper: AllTheProviders,
      ...renderOptions,
    }),
  }
}

// Mock API responses
export const mockApiResponse = <T,>(data: T): Promise<{ data: T }> => {
  return Promise.resolve({ data })
}

// Mock API error
export const mockApiError = (status = 400, message = 'Bad Request'): Promise<never> => {
  return Promise.reject({
    response: {
      status,
      data: { detail: message },
    },
  })
}

// Mock API service
export const createMockApiService = () => {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
} 