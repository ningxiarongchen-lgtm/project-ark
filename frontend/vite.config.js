import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// 🔄 Updated: 2025-10-31 - Force cache clear
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      }
    }
  },
  build: {
    // 清除缓存，确保使用最新代码
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})


