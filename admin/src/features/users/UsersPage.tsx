import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { Search, RefreshCw, Eye, Pencil, Loader2, Users as UsersIcon, KeyRound, ShieldBan, ShieldCheck } from 'lucide-react';
import { api, type PageResult } from '@/lib/api';
import { PageHeader } from '@/features/shared/PageHeader';
import { DataTablePagination } from '@/features/shared/DataTablePagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn, formatDateTime } from '@/lib/utils';
import type { AdminUserRow, MembershipTier } from '@/types';
import { TIER_TEXT, TIER_BADGE } from '@/types';
import { UserEditDialog } from './UserEditDialog';
import { UserDetailDrawer } from './UserDetailDrawer';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { ToggleStatusDialog } from './ToggleStatusDialog';

const TIER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: '全部等级' },
  { value: 'guest', label: '游客' },
  { value: 'free', label: '免费用户' },
  { value: 'member', label: '会员' },
];

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tier, setTier] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [detailUser, setDetailUser] = useState<AdminUserRow | null>(null);
  const [editUser, setEditUser] = useState<AdminUserRow | null>(null);
  const [resetUser, setResetUser] = useState<AdminUserRow | null>(null);
  const [toggleUser, setToggleUser] = useState<AdminUserRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, tier, pageSize]);

  const query = useQuery({
    queryKey: ['admin', 'users', { search: debouncedSearch, tier, page, pageSize }],
    queryFn: () =>
      api.get<PageResult<AdminUserRow>>(
        `/users?search=${encodeURIComponent(debouncedSearch)}&tier=${tier}&page=${page}&pageSize=${pageSize}`
      ),
  });

  const columns = useMemo<ColumnDef<AdminUserRow>[]>(
    () => [
      {
        accessorKey: 'email',
        header: '邮箱',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.email || '(未设置邮箱)'}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.id}</p>
          </div>
        ),
      },
      {
        accessorKey: 'tier',
        header: '等级',
        cell: ({ row }) => (
          <Badge variant={TIER_BADGE[row.original.tier as MembershipTier] || 'muted'}>
            {TIER_TEXT[row.original.tier as MembershipTier] || row.original.tier}
          </Badge>
        ),
      },
      {
        accessorKey: 'member_until',
        header: '会员到期',
        cell: ({ row }) => formatDateTime(row.original.member_until),
      },
      {
        accessorKey: 'remaining_pdf_exports',
        header: 'PDF 剩余',
        cell: ({ row }) => row.original.remaining_pdf_exports,
      },
      {
        accessorKey: 'remaining_png_exports',
        header: 'PNG 剩余',
        cell: ({ row }) => row.original.remaining_png_exports,
      },
      {
        accessorKey: 'remaining_ats_checks',
        header: 'ATS 剩余',
        cell: ({ row }) => row.original.remaining_ats_checks,
      },
      {
        accessorKey: 'created_at',
        header: '创建时间',
        cell: ({ row }) => formatDateTime(row.original.created_at),
      },
      {
        accessorKey: 'status',
        header: '状态',
        cell: ({ row }) => (
          <Badge variant={row.original.status === 'disabled' ? 'destructive' : 'success'}>
            {row.original.status === 'disabled' ? '已禁用' : '正常'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '操作',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setDetailUser(row.original); }}
              className="h-7 gap-1 text-xs"
            >
              <Eye className="h-3.5 w-3.5" /> 详情
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setEditUser(row.original); }}
              className="h-7 gap-1 text-xs"
            >
              <Pencil className="h-3.5 w-3.5" /> 编辑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setResetUser(row.original); }}
              className="h-7 gap-1 text-xs"
            >
              <KeyRound className="h-3.5 w-3.5" /> 重置密码
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 gap-1 text-xs',
                row.original.status === 'disabled'
                  ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                  : 'text-destructive hover:text-destructive hover:bg-destructive/10'
              )}
              onClick={(e) => { e.stopPropagation(); setToggleUser(row.original); }}
            >
              {row.original.status === 'disabled'
                ? <ShieldCheck className="h-3.5 w-3.5" />
                : <ShieldBan className="h-3.5 w-3.5" />}
              {row.original.status === 'disabled' ? '启用' : '禁用'}
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: query.data?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: query.data ? Math.ceil(query.data.total / query.data.pageSize) : -1,
  });

  return (
    <div>
      <PageHeader
        title="用户管理"
        description="查看与管理平台全部用户及其会员权益"
        actions={
          <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCw className={cn('h-4 w-4', query.isFetching && 'animate-spin')} />
            刷新
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索用户邮箱"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
        <Select value={tier} onValueChange={setTier}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="全部等级" />
          </SelectTrigger>
          <SelectContent>
            {TIER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : (table.getRowModel().rows.length === 0) ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center text-muted-foreground">
                  <UsersIcon className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  暂无用户数据
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="cursor-pointer" onClick={() => setDetailUser(row.original)}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="border-t">
          <DataTablePagination
            page={page}
            pageSize={pageSize}
            total={query.data?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {query.isError && (
        <p className="mt-4 text-sm text-destructive">
          加载失败：{query.error?.message || '未知错误'}
        </p>
      )}

      <UserEditDialog
        user={editUser}
        onClose={() => setEditUser(null)}
        onSuccess={() => query.refetch()}
      />

      <ResetPasswordDialog
        user={resetUser}
        onClose={() => setResetUser(null)}
        onSuccess={() => query.refetch()}
      />

      <ToggleStatusDialog
        user={toggleUser}
        onClose={() => setToggleUser(null)}
        onSuccess={() => query.refetch()}
      />

      <UserDetailDrawer
        userId={detailUser?.id ?? null}
        onClose={() => setDetailUser(null)}
        onEdit={(u) => {
          setDetailUser(null);
          setEditUser(u);
        }}
        onResetPassword={(u) => {
          setDetailUser(null);
          setResetUser(u);
        }}
        onToggleStatus={(u) => {
          setDetailUser(null);
          setToggleUser(u);
        }}
      />
    </div>
  );
}
