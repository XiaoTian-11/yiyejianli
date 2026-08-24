import { createClient, SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

// 服务端专用 Supabase 客户端（service_role key 绕过 RLS）。
// 仅供 server.ts / server/* 使用，绝不能 import 到前端（Vite 不打包 server/，天然隔离）。
let client: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      '服务端缺少 SUPABASE_SERVICE_ROLE_KEY 或 VITE_SUPABASE_URL 环境变量。' +
      '请复制 .env.example 为 .env 并填入 Supabase 项目 Settings → API → service_role secret。'
    );
  }

  client = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    // Node <22 无原生 WebSocket，注入 ws 包（服务器 Node 20 必须，否则 RealtimeClient 初始化抛错）
    realtime: { transport: WebSocket as any },
  });
  return client;
}

// 测试用：重置单例
export function __resetAdminClient() {
  client = null;
}
