import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// 🔄 Updated: 2025-11-01 - Force complete cache invalidation
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
    // 强制失效所有缓存
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // 添加时间戳到文件名，强制失效缓存
        entryFileNames: `assets/[name]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-${Date.now()}.[ext]`
      }
    },
    // 清除输出目录
    emptyOutDir: true,
    // 禁用 CSS 代码分割
    cssCodeSplit: true,
    // 生成源映射
    sourcemap: false
  }
})


