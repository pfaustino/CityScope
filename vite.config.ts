import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { bakeStaticOverlay } from './scripts/bake-static.ts'

const REPO = 'CityScope'

/** Physical folders so GitHub Pages returns HTTP 200 for shared deep links. 404.html is still 404 status. */
const SPA_DIRS = [
  'airport',
  'businesses',
  'crime',
  'demographics',
  'development',
  'environment',
  'investigations',
  'map',
  'money',
  'police',
  'reports',
  'reports/airport',
  'reports/business',
  'reports/crime-annual',
  'reports/crime-compare',
  'reports/crime-monthly',
  'reports/crime-quarterly',
  'reports/crime-weekly',
  'reports/demographics',
  'reports/development',
  'reports/environment',
  'reports/housing',
  'reports/money',
  'reports/police',
  'reports/transport',
  'settings',
  'sources',
  'transportation',
]

function pagesPlugins(): Plugin[] {
  return [
    {
      name: 'cityscope-bake-static',
      apply: 'build',
      buildStart() {
        bakeStaticOverlay()
      },
    },
    {
      name: 'cityscope-spa-fallback',
      apply: 'build',
      closeBundle() {
        const index = path.resolve(__dirname, 'dist/index.html')
        if (!existsSync(index)) return
        copyFileSync(index, path.resolve(__dirname, 'dist/404.html'))
        for (const dir of SPA_DIRS) {
          const dest = path.resolve(__dirname, 'dist', dir)
          mkdirSync(dest, { recursive: true })
          copyFileSync(index, path.join(dest, 'index.html'))
        }
      },
    },
  ]
}

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : `/${REPO}/`,
  plugins: [react(), ...pagesPlugins()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
  preview: {
    port: 4173,
  },
}))
