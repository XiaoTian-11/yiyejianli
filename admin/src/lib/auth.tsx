import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { api } from './api';
import type { AdminUser } from '@/types';

interface AuthContextValue {
  /** 会话恢复中 */
  loading: boolean;
  /** Supabase 登录用户（可能非管理员） */
  user: User | null;
  /** 管理员身份信息（null = 尚未校验通过） */
  adminUser: AdminUser | null;
  /** 非管理员时的提示 */
  forbidden: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [forbidden, setForbidden] = useState<string | null>(null);

  // 校验当前会话是否为管理员
  const verifyAdmin = useCallback(async () => {
    try {
      const me = await api.get<AdminUser>('/me');
      if (me.isAdmin) {
        setAdminUser(me);
        setForbidden(null);
      } else {
        setAdminUser(null);
        setForbidden(`账号 ${me.email || me.id} 无管理权限`);
      }
    } catch (err: any) {
      console.error('[Admin] verifyAdmin failed:', err);
      setAdminUser(null);
      setForbidden(err?.message || '身份校验失败，请重新登录');
    }
  }, []);

  useEffect(() => {
    let disposed = false;

    const sync = async () => {
      const { data } = await supabase.auth.getSession();
      if (disposed) return;
      if (data?.session?.user) {
        setUser(data.session.user);
        await verifyAdmin();
      } else {
        setUser(null);
        setAdminUser(null);
        setForbidden(null);
      }
      setLoading(false);
    };

    sync();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (disposed) return;
      if (session?.user) {
        setUser(session.user);
        void verifyAdmin();
      } else {
        setUser(null);
        setAdminUser(null);
        setForbidden(null);
      }
    });

    return () => {
      disposed = true;
      sub.subscription.unsubscribe();
    };
  }, [verifyAdmin]);

  const login = useCallback(async (email: string, password: string) => {
    setForbidden(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // onAuthStateChange 会自动校验管理员身份
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAdminUser(null);
    setForbidden(null);
  }, []);

  return (
    <AuthContext.Provider value={{ loading, user, adminUser, forbidden, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/**
 * 管理员路由守卫：
 * - 会话恢复中 → loading
 * - 未登录 → 重定向到登录页
 * - 登录但非管理员 → 展示无权限页
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { loading, user, adminUser, forbidden, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">正在验证登录状态...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (forbidden) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-sm rounded-xl border bg-card p-8 text-center shadow">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A5 5 0 005.636 5.636m12.728 12.728A5 5 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-semibold">无访问权限</h2>
          <p className="mb-6 text-sm text-muted-foreground">{forbidden}</p>
          <button
            onClick={() => void logout()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            退出登录
          </button>
        </div>
      </div>
    );
  }

  return <>{adminUser ? children : null}</>;
}
