import { copyFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { bakeStaticOverlay } from './scripts/bake-static.ts'

const REPO = 'CityScope'

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
        if (existsSync(index)) copyFileSync(index, path.resolve(__dirname, 'dist/404.html'))
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
