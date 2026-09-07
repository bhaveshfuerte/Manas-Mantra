import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        enabled: true
      },
      includeAssets: ['apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Manas Matrix',
        short_name: 'ManasMatrix',
        description: 'Manas Matrix Application',
        theme_color: '#ffffff',
        start_url: '/',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: "0.0.0.0",
    proxy: {
      '/api': 'http://127.0.0.1:5001',
      '/uploads': 'http://127.0.0.1:5001'
    }
  },
  build: {
    chunkSizeWarningLimit: 10000
  }
})
