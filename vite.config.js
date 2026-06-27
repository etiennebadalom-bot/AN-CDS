import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/AN-CDS/',
  build: {
    chunkSizeWarningLimit: 1600,
  },
})
