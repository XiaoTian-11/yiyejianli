import { useEffect, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { KeyRound, ShieldBan, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AdminUserRow, MembershipTier } from '@/types';
import { cn } from '@/lib/utils';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { ToggleStatusDialog } from './ToggleStatusDialog';

interface UserEditDialogProps {
  user: AdminUserRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

/** ISO 时间 → datetime-local 输入框值 */
function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export function UserEditDialog({ user, onClose, onSuccess }: UserEditDialogProps) {
  const [tier, setTier] = useState<MembershipTier>('free');
  const [memberUntil, setMemberUntil] = useState('');
  const [pdfQuota, setPdfQuota] = useState('0');
  const [pngQuota, setPngQuota] = useState('0');
  const [atsQuota, setAtsQuota] = useState('0');
  const [status, setStatus] = useState<'active' | 'disabled'>('active');
  const [showReset, setShowReset] = useState(false);
  const [showToggle, setShowToggle] = useState(false);

  useEffect(() => {
    if (user) {
      setTier(user.tier);
      setMemberUntil(isoToLocalInput(user.member_until));
      setPdfQuota(String(user.remaining_pdf_exports ?? 0));
      setPngQuota(String(user.remaining_png_exports ?? 0));
      setAtsQuota(String(user.remaining_ats_checks ?? 0));
      setStatus(user.status === 'disabled' ? 'disabled' : 'active');
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: (payload: unknown) =>
      api.patch<AdminUserRow>(`/users/${user!.id}`, payload),
    onSuccess: () => {
      toast.success('用户信息已更新');
      onSuccess();
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || '更新失败');
    },
  });

  if (!user) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      tier,
      status,
      member_until: localInputToIso(memberUntil),
      remaining_pdf_exports: Number(pdfQuota) || 0,
      remaining_png_exports: Number(pngQuota) || 0,
      remaining_ats_checks: Number(atsQuota) || 0,
    };
    if (Number(pdfQuota) < 0 || Number(pngQuota) < 0 || Number(atsQuota) < 0) {
      toast.error('配额不能为负数');
      return;
    }
    mutation.mutate(payload);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>编辑用户权益</DialogTitle>
          <DialogDescription className="truncate">
            {user.email || user.id}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>会员等级</Label>
            <Select value={tier} onValueChange={(v) => setTier(v as MembershipTier)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="guest">游客 guest</SelectItem>
                <SelectItem value="free">免费用户 free</SelectItem>
                <SelectItem value="member">会员 member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-until">会员到期时间</Label>
            <Input
              id="member-until"
              type="datetime-local"
              value={memberUntil}
              onChange={(e) => setMemberUntil(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {tier === 'member' && !memberUntil ? '提示：会员通常需设置到期时间' : '留空表示无到期限制'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pdf">PDF 剩余</Label>
              <Input id="pdf" type="number" min={0} value={pdfQuota} onChange={(e) => setPdfQuota(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="png">PNG 剩余</Label>
              <Input id="png" type="number" min={0} value={pngQuota} onChange={(e) => setPngQuota(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ats">ATS 剩余</Label>
              <Input id="ats" type="number" min={0} value={atsQuota} onChange={(e) => setAtsQuota(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>账户状态</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'active' | 'disabled')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">正常</SelectItem>
                <SelectItem value="disabled">已禁用</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              禁用后该用户将无法登录使用平台
            </p>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">账户操作</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setShowReset(true)}
              >
                <KeyRound className="h-3.5 w-3.5" /> 重置密码为 123456
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  'h-8 gap-1.5 text-xs',
                  user.status === 'disabled'
                    ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                    : 'text-destructive hover:text-destructive hover:bg-destructive/10'
                )}
                onClick={() => setShowToggle(true)}
              >
                {user.status === 'disabled'
                  ? <ShieldCheck className="h-3.5 w-3.5" />
                  : <ShieldBan className="h-3.5 w-3.5" />}
                {user.status === 'disabled' ? '启用账户' : '禁用账户'}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              密码以加密方式存储，无法查看明文，可一键重置为 123456
            </p>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <ResetPasswordDialog
        user={showReset ? user : null}
        onClose={() => setShowReset(false)}
        onSuccess={() => { onSuccess(); onClose(); }}
      />
      <ToggleStatusDialog
        user={showToggle ? user : null}
        onClose={() => setShowToggle(false)}
        onSuccess={() => { onSuccess(); onClose(); }}
      />
    </Dialog>
  );
}
