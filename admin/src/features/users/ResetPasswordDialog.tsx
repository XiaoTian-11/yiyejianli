import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { KeyRound, Loader2 } from 'lucide-react';
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

interface ResetPasswordDialogProps {
  user: { id: string; email: string | null } | null;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * 重置用户密码确认弹窗：重置后密码固定为 123456。
 * Supabase 密码为 bcrypt 哈希存储，无法查看明文，仅支持重置。
 * 受控组件：open 直接由 props 驱动（避免常驻挂载时 state 不同步导致点击无反应）。
 */
export function ResetPasswordDialog({ user, onClose, onSuccess }: ResetPasswordDialogProps) {
  const mutation = useMutation({
    mutationFn: () => api.post<{ success: boolean }>(`/users/${user!.id}/reset-password`),
    onSuccess: () => {
      toast.success(`已将 ${user?.email || user?.id} 的密码重置为 123456`);
      onSuccess();
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || '重置失败');
      onClose();
    },
  });

  return (
    <AlertDialog
      open={!!user}
      onOpenChange={(next) => !next && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> 重置登录密码
          </AlertDialogTitle>
          <AlertDialogDescription className="break-all">
            确认将用户 <span className="font-medium text-foreground">{user?.email || user?.id}</span> 的登录密码
            重置为 <span className="font-mono font-medium text-foreground">123456</span> 吗？
            <br />
            重置后该用户需使用新密码登录。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>取消</AlertDialogCancel>
          <AlertDialogAction
            disabled={mutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" /> 重置中...
              </>
            ) : (
              '确认重置'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
