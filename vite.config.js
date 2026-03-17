import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react', 'react-dom', '@clerk/react'],
  },
  build: {
    minify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/[\\/]node_modules[\\/](react-dom|react|scheduler)[\\/]/.test(id)) {
            return 'vendor';
          }
          if (/[\\/]node_modules[\\/]@clerk[\\/]/.test(id)) {
            return 'clerk';
          }
        },
      },
    },
  },
})
