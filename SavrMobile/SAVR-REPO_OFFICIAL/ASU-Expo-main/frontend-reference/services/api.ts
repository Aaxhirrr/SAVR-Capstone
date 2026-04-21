import axios, { AxiosRequestConfig } from 'axios';

// Check if we're in development or production
const isDev = import.meta.env.DEV;

// Determine the most appropriate API base URL.
// In dev mode, use the server's IP directly (backend runs on same host)
// In production, use /api which Nginx proxies to the backend
let baseURL: string;

if (isDev) {
  // In dev mode, connect directly to the backend on the same server
  // Use window.location.hostname to get the current server IP (e.g., 82.25.90.109)
  // If page is HTTPS (dev:https), use relative URLs to go through Vite's proxy
  // to avoid mixed-content blocking
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  if (isHttps) {
    baseURL = '';
  } else {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    baseURL = `http://${hostname}:8000`;
  }
} else {
  // In production, use /api prefix (Nginx proxies this to backend)
  baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
}

// Log the environment and resolved URL

// Create API instance with base URL
const api = axios.create({
  baseURL,
  timeout: 30000, // Default timeout (30 seconds)
});

// Track if we're currently having backend connection issues
let hasConnectionIssues = false;

// Function to determine if a request contains image data
const requestContainsImage = (config: AxiosRequestConfig) => {
  if (config?.data) {
    // For FormData
    if (config.data instanceof FormData) {
      return Array.from(config.data.entries()).some(([key, _value]) => 
        String(key).toLowerCase().includes('image') || String(key) === 'imageBase64'
      );
    }
    
    // For JSON data
    try {
      const data = typeof config.data === 'string' 
        ? JSON.parse(config.data) 
        : config.data;
      
      return data && (
        data.imageBase64 || 
        data.image || 
        (data.data && (data.data.imageBase64 || data.data.image))
      );
    } catch (e) {
      return false;
    }
  }
  return false;
};

// Add request interceptor to include auth token in all requests
api.interceptors.request.use(
  (config) => {
    
    // Set longer timeout for image-containing requests
    if (requestContainsImage(config)) {
      config.timeout = 120000; // 2 minutes for image requests
    }
    // Don't reduce timeout if the caller already set a custom one
    else if (config.timeout && config.timeout > 30000) {
      // Keep the caller's explicit timeout
    }
    // Check for connection issues (but don't reduce timeout for price check polling or cart builds)
    else if (hasConnectionIssues && config.url !== '/health' && config.url !== '/ping'
             && !config.url?.includes('latest-search') && !config.url?.includes('check_prices')
             && !config.url?.includes('/cart/')) {
      console.warn('Connection issues detected, adjusting timeout');
      config.timeout = 10000; // Reduce timeout when we know there are issues
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:');
    return Promise.reject(error);
  }
);

// Add response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Response error:', error.message);
    
    // Enhanced logging for timeout errors with image detection
    if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
      const hasImage = error.config && requestContainsImage(error.config);
      console.error(
        `Request timeout: ${error.config?.url}`,
        `Timeout duration: ${error.config?.timeout} ms`,
        hasImage ? 'Request contained image data' : ''
      );
    }
    
    // Track connection issues
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout') || 
        error.message.includes('Network Error')) {
      console.error('Connection issue detected!');
      hasConnectionIssues = true;
      
      // Auto-reset after 1 minute
      setTimeout(() => {
        hasConnectionIssues = false;
      }, 60000);
    }
    
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.error('Session expired, redirecting to login');
      
      // Clear authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user');
      
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Add a health check function
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    // Use a very short timeout for health check
    const response = await api.get('/health', { timeout: 3000 });
    hasConnectionIssues = false; // Reset if successful
    return response.status === 200;
  } catch (error) {
    console.error('Health check failed:');
    hasConnectionIssues = true;
    return false;
  }
};

// Note: Mock handlers removed - dev mode now uses Vite proxy to connect to real backend

export default api;

// Export api as apiClient for consistent naming in services
export const apiClient = api; 