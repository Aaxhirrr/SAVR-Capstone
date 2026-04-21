import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// API route prefixes that should be proxied to the backend
const apiPrefixes = [
  'auth',
  'chat',
  'user',
  'stores',
  'grocery-lists',
  'check-prices',
  'admin',
  'shared',
  'share',
  'shopping',
  'orders',
  'agent',
  'reports',
  'presence',
  'lists',
  'health',
  'ping',
  'debug',
  'server-info',
  'echo',
  'api-test',
  'blog',
];

// Build proxy config dynamically
const proxyConfig: Record<string, any> = {};
for (const prefix of apiPrefixes) {
  proxyConfig[`/${prefix}`] = {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
    secure: false,
    ws: prefix === 'chat', // Enable WebSocket for chat
  };
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true, // allow LAN access (binds 0.0.0.0)
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 150,
    },
    hmr: {
      host: process.env.VITE_HMR_HOST || undefined,
      port: 5173,
      clientPort: 5173,
    },
    proxy: proxyConfig,
  },
});