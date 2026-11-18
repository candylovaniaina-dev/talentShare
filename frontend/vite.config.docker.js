import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'

const API_TARGET = process.env.VITE_API_TARGET || 'http://backend:8001'

export default defineConfig({
  plugins: [
    react(),
    mkcert({ hosts: ['talentshare.mg', 'localhost', '192.168.1.2'], source: 'coding' }),
  ],
  server: {
    host: '0.0.0.0',
    port: 443,
    strictPort: true,
    // Configuration HMR explicite pour Docker
    hmr: {
      host: 'talentshare.mg',
      protocol: 'wss',
      clientPort: 443,
    },
    // Autorise le domaine
    allowedHosts: [
      'talentshare.mg'
    ],
    watch: { usePolling: true, interval: 300 },
    proxy: {
      '/api':     { target: API_TARGET, changeOrigin: true },
      '/storage': { target: API_TARGET, changeOrigin: true },
    },
  },
})