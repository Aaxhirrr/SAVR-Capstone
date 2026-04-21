import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    historyApiFallback: true,
    proxy: {
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      '/ping': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/debug': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/server-info': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/echo': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
}); 