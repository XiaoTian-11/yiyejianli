import { useEffect, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
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

  useEffect(() => {
    if (user) {
      setTier(user.tier);
      setMemberUntil(isoToLocalInput(user.member_until));
      setPdfQuota(String(user.remaining_pdf_exports ?? 0));
      setPngQuota(String(user.remaining_png_exports ?? 0));
      setAtsQuota(String(user.remaining_ats_checks ?? 0));
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
    </Dialog>
  );
}
