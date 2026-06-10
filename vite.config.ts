import { reactRouter } from "@react-router/dev/vite";
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    reactRouter(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Workout Tracker',
        short_name: 'Workout',
        description: 'Tracker de entrenamiento local-first',
        theme_color: '#09090b', // hsl(240 10% 3.9%) -> background dark mode
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
