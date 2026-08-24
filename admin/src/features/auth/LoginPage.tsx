import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import logo from '@/assets/logo.svg';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('请输入邮箱与密码');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      // 登录后由 onAuthStateChange 校验管理员身份；
      // 校验通过后 RequireAdmin 会渲染业务页，这里跳转工作台。
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.message || '登录失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 shadow-lg">
            <img src={logo} alt="壹页简历" className="h-12 w-12 rounded-xl" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold">壹页简历 · 管理后台</h1>
            <p className="text-sm text-muted-foreground">请使用管理员账号登录</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border bg-card p-6 shadow-sm"
        >
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? '登录中...' : '登 录'}
          </Button>

          {from && (
            <p className="text-center text-xs text-muted-foreground">
              登录后将返回原页面
            </p>
          )}
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          访问受保护 · 请勿向他人泄露管理员凭证
        </p>
      </div>
    </div>
  );
}
