import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@xenova/transformers', 'onnxruntime-web'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('html2canvas')) return 'capture-vendor'
          if (id.includes('recharts')) return 'charts-vendor'
          if (id.includes('framer-motion')) return 'motion-vendor'
          if (id.includes('@floating-ui')) return 'floating-ui-vendor'
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/') ||
            id.includes('/i18next/') ||
            id.includes('/react-i18next/') ||
            id.includes('/i18next-browser-languagedetector/') ||
            id.includes('/zustand/')
          ) {
            return 'app-vendor'
          }
        },
      },
    },
  },
})
