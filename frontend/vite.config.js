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
    // 浏览器兼容性目标 - 支持Safari、移动端
    target: ['es2015', 'safari11', 'ios11'],
    // 使用Vite默认的代码分割策略
    rollupOptions: {
      output: {
        // 简化文件名，添加时间戳
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      }
    },
    // 清除输出目录
    emptyOutDir: true,
    // CSS 代码分割
    cssCodeSplit: true,
    // 生成源映射
    sourcemap: false,
    // CSS 兼容性
    cssTarget: 'safari11',
    // 压缩选项 - 更激进的压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 移除console
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'], // 移除特定函数调用
        passes: 2 // 多次压缩以获得更好效果
      },
      format: {
        comments: false // 移除所有注释
      }
    },
    // 设置chunk大小警告限制
    chunkSizeWarningLimit: 800,
    // 报告压缩后的大小
    reportCompressedSize: true,
    // 启用CSS压缩
    cssMinify: true
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'antd', 
      'leancloud-storage',
      '@radix-ui/react-dialog'
    ]
  },
  // 解决 Radix UI 依赖问题
  resolve: {
    alias: {
      '@radix-ui/react-dialog': '@radix-ui/react-dialog'
    }
  }
})


