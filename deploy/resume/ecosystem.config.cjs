// ============================================================================
// 壹页简历 PM2 进程配置（服务器 /var/www/yiyejianli/ 下运行）
//
// 部署：pm2 start ecosystem.config.cjs && pm2 save
// 说明：PORT=3001 避开谷团宝后端（3000）；云 Supabase 方案，无需本地数据库
//       .env 放同目录，由服务端 dotenv 加载（密钥不打包进镜像/产物）
// ============================================================================
module.exports = {
  apps: [
    {
      name: "yiyejianli",
      script: "dist/server.cjs",
      cwd: "/var/www/yiyejianli",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      // 2G 服务器：Node 进程限 400MB，防内存泄漏拖垮整机
      max_memory_restart: "400M",
      // 崩溃自动重启 + 日志
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      out_file: "/var/www/yiyejianli/logs/out.log",
      error_file: "/var/www/yiyejianli/logs/error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
