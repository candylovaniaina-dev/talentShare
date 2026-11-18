import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  plugins: [
    react(),
    mkcert({
      hosts: ['talentshare.mg', 'localhost', '192.168.1.2'], // Déclarer le domaine
      source: 'coding'
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 443,
    strictPort: true,
    hmr: {
      host: 'talentshare.mg',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/storage': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
})