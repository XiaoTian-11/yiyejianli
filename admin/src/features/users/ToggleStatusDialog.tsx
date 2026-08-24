import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShieldBan, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { AdminUserRow } from '@/types';

interface ToggleStatusDialogProps {
  user: AdminUserRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * 禁用/启用用户确认弹窗。
 * disabled 状态下该用户登录后将被自动登出，无法使用平台。
 */
export function ToggleStatusDialog({ user, onClose, onSuccess }: ToggleStatusDialogProps) {
  const [open, setOpen] = useState(!!user);
  const disabling = user?.status !== 'disabled';

  const mutation = useMutation({
    mutationFn: () =>
      api.patch<AdminUserRow>(`/users/${user!.id}`, { status: disabling ? 'disabled' : 'active' }),
    onSuccess: () => {
      toast.success(disabling
        ? `已禁用 ${user?.email || user?.id}`
        : `已启用 ${user?.email || user?.id}`);
      onSuccess();
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || '操作失败');
      onClose();
    },
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) onClose();
  };

  return (
    <AlertDialog open={open && !!user} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {disabling ? (
              <ShieldBan className="h-4 w-4" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {disabling ? '禁用用户账户' : '启用用户账户'}
          </AlertDialogTitle>
          <AlertDialogDescription className="break-all">
            确认{disabling ? '禁用' : '启用'}用户{' '}
            <span className="font-medium text-foreground">{user?.email || user?.id}</span> 吗？
            {disabling && (
              <>
                <br />
                禁用后该用户将无法登录使用平台，需管理员手动启用后才能恢复。
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>取消</AlertDialogCancel>
          <AlertDialogAction
            disabled={mutation.isPending}
            className={disabling ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : undefined}
            onClick={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" /> 处理中...
              </>
            ) : disabling ? (
              '确认禁用'
            ) : (
              '确认启用'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
