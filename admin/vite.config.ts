import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  // 复用项目根目录 .env（含 VITE_SUPABASE_URL 等）
  envDir: '..',
  // 生产部署于 /admin 子路径；开发模式在 Vite dev server 根路径
  base: mode === 'production' ? '/admin/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // 开发环境：/api 代理到现有 Express 服务（server.ts 端口 3000）
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // 输出到项目根目录 dist/admin，由生产 server 以 /admin 子路径托管
    outDir: '../dist/admin',
  },
}));
