import { createClient, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
