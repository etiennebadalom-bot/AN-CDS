import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        format: 'iife',
        name: 'GGA2026',
      },
    },
  },
})
