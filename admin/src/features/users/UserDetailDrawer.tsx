import { useQuery } from '@tanstack/react-query';
import { Loader2, Pencil, FileText, ShoppingCart, KeyRound, ShieldBan, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDateTime, formatAmount } from '@/lib/utils';
import type { AdminUserRow, UserDetail, OrderStatus } from '@/types';
import {
  TIER_TEXT,
  TIER_BADGE,
  ORDER_STATUS_TEXT,
  ORDER_STATUS_BADGE,
  PLAN_TYPE_TEXT,
  RESUME_STATUS_TEXT,
} from '@/types';
interface UserDetailDrawerProps {
  userId: string | null;
  onClose: () => void;
  onEdit: (user: AdminUserRow) => void;
  onToggleStatus?: (user: AdminUserRow) => void;
  onResetPassword?: (user: AdminUserRow) => void;
}

function Field({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-all">{value ?? '-'}</p>
    </div>
  );
}

export function UserDetailDrawer({ userId, onClose, onEdit, onToggleStatus, onResetPassword }: UserDetailDrawerProps) {
  const query = useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => api.get<UserDetail>(`/users/${userId}`),
    enabled: !!userId,
  });

  const user = query.data;

  return (
    <Dialog open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>用户详情</DialogTitle>
        </DialogHeader>

        {query.isLoading && (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {query.isError && (
          <p className="py-10 text-center text-sm text-destructive">
            加载失败：{query.error?.message}
          </p>
        )}

        {user && (
          <div className="space-y-5">
            {/* 基本信息 */}
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">会员信息</h3>
                <div className="flex flex-wrap items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() => onResetPassword?.(user)}
                  >
                    <KeyRound className="h-3.5 w-3.5" /> 重置密码
                  </Button>
                  <Button
                    variant={user.status === 'disabled' ? 'outline' : 'destructive'}
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() => onToggleStatus?.(user)}
                  >
                    {user.status === 'disabled'
                      ? <ShieldCheck className="h-3.5 w-3.5" />
                      : <ShieldBan className="h-3.5 w-3.5" />}
                    {user.status === 'disabled' ? '启用' : '禁用'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() => onEdit(user)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> 编辑
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Field label="邮箱" value={user.email} />
                <Field label="用户 ID" value={user.id} />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">会员等级</p>
                  <Badge variant={TIER_BADGE[user.tier] || 'muted'}>
                    {TIER_TEXT[user.tier] || user.tier}
                  </Badge>
                </div>
                <Field label="状态" value={user.status === 'disabled' ? '已禁用' : '正常'} />
                <Field label="密码" value="已加密（不可查看）" />
                <Field label="会员到期" value={formatDateTime(user.member_until)} />
                <Field label="PDF 剩余" value={user.remaining_pdf_exports} />
                <Field label="PNG 剩余" value={user.remaining_png_exports} />
                <Field label="ATS 剩余" value={user.remaining_ats_checks} />
                <Field label="创建时间" value={formatDateTime(user.created_at)} />
              </div>
            </div>

            {/* 关联数据 */}
            <Tabs defaultValue="orders">
              <TabsList>
                <TabsTrigger value="orders">
                  <ShoppingCart className="mr-1 h-3.5 w-3.5" /> 订单 ({user.orders.length})
                </TabsTrigger>
                <TabsTrigger value="resumes">
                  <FileText className="mr-1 h-3.5 w-3.5" /> 简历 ({user.resumes.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="orders">
                <div className="max-h-72 overflow-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/60 text-xs text-muted-foreground">
                      <tr>
                        <th className="p-2 text-left">订单号</th>
                        <th className="p-2 text-left">方案</th>
                        <th className="p-2 text-right">金额</th>
                        <th className="p-2 text-left">状态</th>
                        <th className="p-2 text-left">时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.orders.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-muted-foreground">
                            暂无订单
                          </td>
                        </tr>
                      )}
                      {user.orders.map((o) => (
                        <tr key={o.id} className="border-t">
                          <td className="p-2 font-mono text-xs">{o.id}</td>
                          <td className="p-2">{o.plan_name || PLAN_TYPE_TEXT[o.plan_type] || o.plan_type}</td>
                          <td className="p-2 text-right">{formatAmount(o.amount)}</td>
                          <td className="p-2">
                            <Badge variant={ORDER_STATUS_BADGE[o.status as OrderStatus]}>
                              {ORDER_STATUS_TEXT[o.status as OrderStatus] || o.status}
                            </Badge>
                          </td>
                          <td className="p-2 text-xs text-muted-foreground">{formatDateTime(o.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="resumes">
                <div className="max-h-72 overflow-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/60 text-xs text-muted-foreground">
                      <tr>
                        <th className="p-2 text-left">简历名称</th>
                        <th className="p-2 text-left">模板</th>
                        <th className="p-2 text-left">评分</th>
                        <th className="p-2 text-left">状态</th>
                        <th className="p-2 text-left">更新时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.resumes.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-muted-foreground">
                            暂无简历
                          </td>
                        </tr>
                      )}
                      {user.resumes.map((r) => (
                        <tr key={r.id} className="border-t">
                          <td className="p-2 font-medium">{r.name}</td>
                          <td className="p-2">{r.template_id}</td>
                          <td className="p-2">{r.score}</td>
                          <td className="p-2">
                            <Badge variant="outline">{RESUME_STATUS_TEXT[r.status] || r.status}</Badge>
                          </td>
                          <td className="p-2 text-xs text-muted-foreground">{formatDateTime(r.updated_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
