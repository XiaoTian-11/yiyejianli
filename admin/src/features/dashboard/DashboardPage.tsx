import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  ShoppingCart,
  CheckCircle2,
  Wallet,
  Percent,
  Crown,
  FileText,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/features/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAmount, cn } from '@/lib/utils';
import type { StatsOverview, TrendPoint } from '@/types';

interface StatItem {
  key: keyof StatsOverview;
  label: string;
  icon: typeof Users;
  iconClass: string;
  format: (v: number) => string;
}

const STATS: StatItem[] = [
  { key: 'totalUsers', label: '用户总数', icon: Users, iconClass: 'bg-sky-100 text-sky-600', format: (v) => v.toLocaleString() },
  { key: 'newUsersToday', label: '今日新增用户', icon: UserPlus, iconClass: 'bg-emerald-100 text-emerald-600', format: (v) => v.toLocaleString() },
  { key: 'totalOrders', label: '订单总数', icon: ShoppingCart, iconClass: 'bg-violet-100 text-violet-600', format: (v) => v.toLocaleString() },
  { key: 'paidOrdersToday', label: '今日成交订单', icon: CheckCircle2, iconClass: 'bg-teal-100 text-teal-600', format: (v) => v.toLocaleString() },
  { key: 'gmv', label: '成交总额 GMV', icon: Wallet, iconClass: 'bg-amber-100 text-amber-600', format: (v) => formatAmount(v) },
  { key: 'conversionRate', label: '付费转化率', icon: Percent, iconClass: 'bg-pink-100 text-pink-600', format: (v) => `${v.toFixed(2)}%` },
  { key: 'memberUsers', label: '会员用户数', icon: Crown, iconClass: 'bg-indigo-100 text-indigo-600', format: (v) => v.toLocaleString() },
  { key: 'totalResumes', label: '简历总数', icon: FileText, iconClass: 'bg-slate-100 text-slate-600', format: (v) => v.toLocaleString() },
];

function TrendChart({
  points,
  valueKey,
  unit,
  color,
}: {
  points: TrendPoint[];
  valueKey: 'orders' | 'gmv';
  unit: (v: number) => string;
  color: string;
}) {
  if (!points.length) return <p className="py-10 text-center text-sm text-muted-foreground">暂无数据</p>;

  const max = Math.max(...points.map((p) => p[valueKey]), 1);

  return (
    <div className="flex h-44 items-end gap-1">
      {points.map((p) => {
        const h = Math.max((p[valueKey] / max) * 140, 2);
        const date = p.date.slice(5); // MM-DD
        return (
          <div key={p.date} className="group flex flex-1 flex-col items-center gap-1">
            <div className="relative flex w-full items-end justify-center" style={{ height: 152 }}>
              <div
                className={cn('w-full max-w-8 rounded-t-sm transition-all group-hover:opacity-80', color)}
                style={{ height: h }}
                title={`${date}：${unit(p[valueKey])}`}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{date}</span>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ item, value, loading }: { item: StatItem; value: number; loading: boolean }) {
  const Icon = item.icon;
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{item.label}</p>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-20" />
            ) : (
              <p className="mt-1 text-2xl font-bold tracking-tight">{item.format(value)}</p>
            )}
          </div>
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', item.iconClass)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const overviewQuery = useQuery<StatsOverview>({
    queryKey: ['admin', 'stats', 'overview'],
    queryFn: () => api.get<StatsOverview>('/stats/overview'),
  });

  const trendQuery = useQuery<TrendPoint[]>({
    queryKey: ['admin', 'stats', 'trend', 7],
    queryFn: () => api.get<TrendPoint[]>('/stats/orders-trend?days=7'),
  });

  const overview = overviewQuery.data;

  return (
    <div>
      <PageHeader
        title="工作台"
        description="平台核心运营指标概览（数据来自 Supabase 实时统计）"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((item) => (
          <StatCard
            key={item.key}
            item={item}
            value={overview ? (overview[item.key] as number) : 0}
            loading={overviewQuery.isLoading}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">近 7 天每日订单量</CardTitle>
          </CardHeader>
          <CardContent>
            {trendQuery.isLoading ? (
              <Skeleton className="h-44 w-full" />
            ) : (
              <TrendChart
                points={trendQuery.data || []}
                valueKey="orders"
                color="bg-sky-500"
                unit={(v) => `${v} 单`}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">近 7 天每日成交额（GMV）</CardTitle>
          </CardHeader>
          <CardContent>
            {trendQuery.isLoading ? (
              <Skeleton className="h-44 w-full" />
            ) : (
              <TrendChart
                points={trendQuery.data || []}
                valueKey="gmv"
                color="bg-amber-500"
                unit={(v) => formatAmount(v)}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {overviewQuery.isError && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <Loader2 className="h-4 w-4 animate-spin" />
          {overviewQuery.error?.message || '加载统计数据失败'}
        </div>
      )}
    </div>
  );
}
