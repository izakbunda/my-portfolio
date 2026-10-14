import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Shown in Apple menu > About This Portfolio.
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    proxy: {
      '/agent': {
        target: 'http://localhost:8000',
        rewrite: (path) => path.replace(/^\/agent/, ''),
      },
    },
  },
})
