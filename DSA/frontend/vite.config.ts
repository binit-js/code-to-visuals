import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      'cn': path.resolve(import.meta.dirname, './src/lib/utils.ts'),
      '@animate-ui/react/primitives/cursor': path.resolve(import.meta.dirname, './src/components/animate-ui/primitives/cursor/index.tsx'),
      '@animate-ui/react/primitives/effects/click': path.resolve(import.meta.dirname, './src/components/animate-ui/primitives/effects/click/index.tsx'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
