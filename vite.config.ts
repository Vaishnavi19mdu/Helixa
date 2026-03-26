import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),

      VitePWA({
        registerType: 'autoUpdate',

        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],

        manifest: {
          name: 'Helixa',
          short_name: 'Helixa',
          description: 'AI-powered healthcare platform',
          theme_color: '#007099',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },

        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}'],

          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'cloudinary-assets',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/ui-avatars\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'ui-avatars',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/api\.groq\.com\/.*/i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/(firestore|firebase)\.googleapis\.com\/.*/i,
              handler: 'NetworkOnly',
            },
          ],

          navigateFallback: '/index.html',
          navigateFallbackDenylist: [
            /^\/api\//,
            /^https:\/\/api\.groq\.com/,
            /^https:\/\/firestore\.googleapis\.com/,
          ],

          skipWaiting: true,
          clientsClaim: true,
        },

        devOptions: {
          enabled: false,
        },
      }),
    ],

    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});