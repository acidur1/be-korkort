import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

const manifest = {
  name: 'BE-Körkortsfrågor',
  short_name: 'Körkort',
  description: 'Testa dina kunskaper inom BE-körkort.',
  lang: 'sv',
  theme_color: '#1e3a5f',
  background_color: '#f7f6f2',
  display: 'standalone',
  orientation: 'portrait',
  start_url: '/',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}

// Workaround for Vite 8 / Rolldown incompatibility with vite-plugin-pwa's
// bundle assignment in generateBundle. This plugin writes the manifest and
// registerSW script directly after the bundle is written.
function pwaManifestFix(outDir) {
  return {
    name: 'pwa-manifest-fix',
    closeBundle() {
      const manifestPath = resolve(outDir, 'manifest.webmanifest')
      writeFileSync(manifestPath, JSON.stringify(manifest) + '\n', 'utf-8')
      const swRegPath = resolve(outDir, 'registerSW.js')
      const swRegContent = `if('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
  })
}\n`
      writeFileSync(swRegPath, swRegContent, 'utf-8')
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: '/index.html',
      },
      devOptions: { enabled: false },
    }),
    pwaManifestFix('dist'),
  ],
})
