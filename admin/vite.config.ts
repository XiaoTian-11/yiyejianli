import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import os from 'os';
import { defineConfig } from 'vite';

// 动态获取本机局域网 IPv4，用于 allowedHosts（IP 变化时也能自适应）
function getLanIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

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
    // 监听所有网卡，支持局域网（其他设备）通过本机 IP 访问
    host: '0.0.0.0',
    port: 5173,
    // vite6 会拦截未声明的 Host 头；放行本机局域网 IP，供局域网访问
    allowedHosts: [getLanIP(), 'localhost', '127.0.0.1'],
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
