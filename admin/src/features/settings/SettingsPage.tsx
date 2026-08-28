import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Gift, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader } from '@/features/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function SettingsPage() {
  const qc = useQueryClient();

  const configQuery = useQuery({
    queryKey: ['admin', 'config'],
    queryFn: () => api.get<{ referral_enabled: boolean }>('/config'),
  });

  const [enabled, setEnabled] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 数据加载完成后用服务端值初始化开关（仅一次）
  const serverEnabled = Boolean(configQuery.data?.referral_enabled);
  if (configQuery.data && !initialized) {
    setEnabled(serverEnabled);
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: (value: boolean) =>
      api.put<{ referral_enabled: boolean }>('/config', { referral_enabled: value }),
    onSuccess: (data) => {
      setEnabled(Boolean(data.referral_enabled));
      void qc.invalidateQueries({ queryKey: ['admin', 'config'] });
      toast.success('已保存', { description: '邀请奖励活动已更新' });
    },
    onError: (err: any) => {
      toast.error('保存失败', { description: err?.message || '请稍后重试' });
    },
  });

  return (
    <div>
      <PageHeader
        title="系统设置"
        description="邀请奖励活动等平台级配置"
      />

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-500" />
              <CardTitle>邀请奖励活动</CardTitle>
            </div>
            <CardDescription>
              开启后：老用户可邀请新用户注册，双方各得 1 次免费导出（邀请人最多 2 次）；
              个人中心卡片、首页活动板块、注册表单邀请码输入框均显示。
              关闭后：所有入口隐藏，发放接口拒绝。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">活动总开关</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  当前状态：
                  <Badge variant={enabled ? 'success' : 'muted'} className="ml-1">
                    {enabled ? '已开启' : '已关闭'}
                  </Badge>
                </p>
              </div>
              {/* 原生 checkbox 样式化开关（不引入额外依赖） */}
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => setEnabled(!enabled)}
                disabled={configQuery.isLoading}
                className={[
                  'relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50',
                  enabled ? 'bg-emerald-500' : 'bg-slate-300',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                    enabled ? 'translate-x-5' : 'translate-x-0',
                  ].join(' ')}
                />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => configQuery.refetch()}
                disabled={configQuery.isFetching}
              >
                <RefreshCw className={configQuery.isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                刷新
              </Button>
              <Button
                size="sm"
                disabled={saveMutation.isPending || configQuery.isLoading}
                onClick={() => saveMutation.mutate(enabled)}
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                保存
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
