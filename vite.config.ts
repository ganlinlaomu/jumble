import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import path from 'path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import packageJson from './package.json'

const getGitHash = () => {
  try {
    return JSON.stringify(execSync('git rev-parse --short HEAD').toString().trim())
  } catch (error) {
    console.warn('Failed to retrieve commit hash:', error)
    return '"unknown"'
  }
}

const getAppVersion = () => {
  try {
    return JSON.stringify(packageJson.version)
  } catch (error) {
    console.warn('Failed to retrieve app version:', error)
    return '"unknown"'
  }
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.GIT_COMMIT': getGitHash(),
    'import.meta.env.APP_VERSION': getAppVersion()
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-monochrome.svg'],
      manifest: {
        name: 'Jumble',
        short_name: 'Jumble',
        description: packageJson.description,
        theme_color: '#FFFFFF',
        background_color: '#FFFFFF',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-monochrome.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'monochrome'
          }
        ],
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        lang: 'en',
        categories: ['social', 'news', 'productivity']
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,json,woff,woff2,ttf,eot}'],
        globDirectory: 'dist/',
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/esm\.sh\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'esm-modules',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.(woff|woff2|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https?:\/\/.*\/(api|relay|nostr)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 5 * 60 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https?:\/\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'general-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ]
})
