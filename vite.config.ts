import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/who-provoked-acne/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: '谁惹痘',
        short_name: '谁惹痘',
        description: '饮食习惯与痘痘变化的本地轻量追踪工具',
        start_url: '/who-provoked-acne/',
        scope: '/who-provoked-acne/',
        display: 'standalone',
        background_color: '#f2f4f7',
        theme_color: '#f2f4f7',
        lang: 'zh-CN',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true
      }
    })
  ],
  test: { environment: 'node', setupFiles: ['./src/test/setup.ts'] }
})
