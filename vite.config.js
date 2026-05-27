import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Recipe Vault – brokeapp',
        short_name: 'RecipeVault',
        description: 'Save & scale recipes from Instagram',
        theme_color: '#1a1208',
        background_color: '#1a1208',
        display: 'standalone',
        share_target: {
          action: '/share-target',
          method: 'GET',
          params: {
            url: 'url',
            text: 'text',
            title: 'title'
          }
        },
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
