import axios, { AxiosRequestConfig } from 'axios';
import authService from './services/authService';

// Create axios instance with configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '/api',
  timeout: 45000, // Default timeout of 45 seconds
});

// Function to determine if a request likely contains image data
const requestContainsImage = (config: AxiosRequestConfig) => {
  if (config.data && typeof config.data === 'object') {
    // For FormData
    if (config.data instanceof FormData) {
      return Array.from(config.data.entries()).some(([key]: [string, FormDataEntryValue]) => 
        key.toLowerCase().includes('image') || key === 'imageBase64'
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

// Helper to strip image data from logs
const stripImageData = (data: any): any => {
  if (!data) return data;
  
  // If data is FormData, recreate an object without raw image content
  if (data instanceof FormData) {
    const entries = Array.from(data.entries()).map(([key, value]) => {
       if (typeof value === 'string' && (key.toLowerCase().includes('image') || key === 'imageBase64')) {
           return [key, '[IMAGE DATA]'];
       }
       return [key, value];
    });
    return Object.fromEntries(entries);
  }
  
  // If data is a JSON object, replace imageBase64 with a placeholder
  if (typeof data === 'object') {
    const copy = { ...data };
    if (copy.imageBase64) {
      copy.imageBase64 = '[IMAGE DATA]';
    }
    return copy;
  }
  return data;
};

// Request interceptor
api.interceptors.request.use(
  config => {
    // Get token and add to headers if it exists
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Set longer timeout for image-containing requests
    if (requestContainsImage(config)) {
      config.timeout = 120000; // 2 minutes for image requests
    }
    
    // Adjust logging: instead of logging full base64, log a placeholder
    const url = config.url || '';
    if (import.meta.env.DEV) {
      if (!url.includes('/presence/heartbeat') && !url.includes('/presence/leave')) {
        console.log(`Request: ${config.method?.toUpperCase()} ${config.url}`, stripImageData(config.data));
      }
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response && error.response.status === 401) {
      // Skip auth redirect for presence endpoints and public pages
      const url = error.config?.url || '';
      const isPresence = url.includes('/presence/heartbeat') || url.includes('/presence/leave');
      if (!isPresence) {
        authService.logout();
        window.location.href = '/login';
      }
    }
    
    // Enhanced logging for timeout errors
    if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
      console.error('Request timeout:', error.config?.url);
      console.error('Timeout duration:', error.config?.timeout, 'ms');
      // Check if it was an image request
      if (error.config && requestContainsImage(error.config)) {
        console.error('Timeout occurred on an image-containing request');
      }
    }
    
    return Promise.reject(error);
  }
); 

export const apiClient = api;
export default api;