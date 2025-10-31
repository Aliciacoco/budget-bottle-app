import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',  
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 允许外部访问
    port: 3000, // 可以改成您喜欢的端口
    open: true  // 自动打开浏览器
  }
  
})