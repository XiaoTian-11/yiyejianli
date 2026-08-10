import { createClient, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ─── 配置校验：在初始化前暴露常见配置错误，避免"神秘失败" ──────────────────
export interface SupabaseConfigIssue {
  ok: boolean;
  message: string;
}

export function validateSupabaseConfig(): SupabaseConfigIssue {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      message: '缺少 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY，请在 .env 中配置（参考 .env.example）',
    };
  }
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(supabaseUrl)) {
    return {
      ok: false,
      message: `VITE_SUPABASE_URL 格式异常（当前: ${supabaseUrl}），应为 https://<project-ref>.supabase.co 形式`,
    };
  }
  return { ok: true, message: '配置格式正确' };
}

/** 实际探测项目域名是否可解析/可访问（auth/v1/health 端点） */
export async function checkSupabaseHealth(): Promise<SupabaseConfigIssue> {
  const format = validateSupabaseConfig();
  if (!format.ok) return format;
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/health`, { signal: AbortSignal.timeout(8000) });
    if (res.ok) return { ok: true, message: `认证服务可达（HTTP ${res.status}）` };
    return { ok: false, message: `认证服务返回 HTTP ${res.status}，项目可能被暂停` };
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (/failed to fetch|load failed|networkerror|could not resolve/i.test(msg)) {
      return {
        ok: false,
        message: `无法连接到 ${supabaseUrl}（域名可能不存在、项目被删除或暂停）。请到 Supabase Dashboard 确认项目状态`,
      };
    }
    return { ok: false, message: `连接异常: ${msg}` };
  }
}

// 初始化时先做格式校验（不阻塞启动，仅告警）
const configIssue = validateSupabaseConfig();
if (!configIssue.ok) {
  console.error('[壹页简历] Supabase 配置异常:', configIssue.message);
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Auth 实例引用（兼容旧 API 中 auth 作为第一个参数的模式）
const auth = supabase.auth;
export { auth };

/**
 * 兼容 Firebase onAuthStateChanged 的 API
 * 签名: onAuthStateChanged(auth, callback)
 * auth 参数保留用于兼容，实际不使用
 */
export function onAuthStateChanged(
  _auth: any,
  callback: (user: User | null) => void
) {
  // 立即触发当前会话状态
  supabase.auth.getSession().then(({ data: { session } }) => {
    callback(session?.user ?? null);
  });

  // 监听后续变化
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  // 返回取消订阅函数
  return subscription.unsubscribe;
}

/**
 * 退出登录（兼容 Firebase signOut(auth) 签名）
 */
export async function signOut(_auth?: any) {
  return supabase.auth.signOut();
}

/**
 * 邮箱密码登录（兼容 Firebase signInWithEmailAndPassword(auth, email, password) 签名）
 */
export async function signInWithEmailAndPassword(
  _auth: any,
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data?.user) throw new Error('登录失败，请重试');
  return data;
}

/**
 * 邮箱密码注册（兼容 Firebase createUserWithEmailAndPassword(auth, email, password) 签名）
 */
export async function createUserWithEmailAndPassword(
  _auth: any,
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data?.user) throw new Error('注册失败，请重试');
  return data;
}

export type { User };
