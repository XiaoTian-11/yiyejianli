import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { Search, RefreshCw, Eye, Loader2, ShoppingCart, RotateCcw } from 'lucide-react';
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
import { cn, formatAmount, formatDateTime } from '@/lib/utils';
import type { AdminOrderRow, OrderStatus, RefundStatus } from '@/types';
import {
  ORDER_STATUS_TEXT,
  ORDER_STATUS_BADGE,
  ORDER_REFUND_STATUS_TEXT,
  ORDER_REFUND_STATUS_BADGE,
  PAYMENT_METHOD_TEXT,
  PLAN_TYPE_TEXT,
} from '@/types';
import { OrderDetailDrawer } from './OrderDetailDrawer';
import { RefundDialog } from './RefundDialog';

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'completed', label: '已完成' },
  { value: 'expired', label: '已过期' },
  { value: 'cancelled', label: '已取消' },
];

const PLAN_OPTIONS = [
  { value: 'all', label: '全部方案' },
  ...Object.entries(PLAN_TYPE_TEXT).map(([value, label]) => ({ value, label })),
];

export function OrdersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [planType, setPlanType] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [detailOrder, setDetailOrder] = useState<AdminOrderRow | null>(null);
  const [refundOrder, setRefundOrder] = useState<AdminOrderRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, planType, pageSize]);

  const query = useQuery({
    queryKey: ['admin', 'orders', { search: debouncedSearch, status, planType, page, pageSize }],
    queryFn: () =>
      api.get<PageResult<AdminOrderRow>>(
        `/orders?search=${encodeURIComponent(debouncedSearch)}&status=${status}&planType=${planType}&page=${page}&pageSize=${pageSize}`
      ),
  });

  const columns = useMemo<ColumnDef<AdminOrderRow>[]>(
    () => [
      {
        accessorKey: 'id',
        header: '订单号',
        cell: ({ row }) => (
          <span className="font-mono text-xs" title={row.original.id}>
            {row.original.id}
          </span>
        ),
      },
      {
        accessorKey: 'user_email',
        header: '用户',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate">{row.original.user_email || '(未知用户)'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'plan_type',
        header: '方案',
        cell: ({ row }) => row.original.plan_name || PLAN_TYPE_TEXT[row.original.plan_type] || row.original.plan_type,
      },
      {
        accessorKey: 'amount',
        header: '金额',
        cell: ({ row }) => {
          const refunded = Number(row.original.refund_amount) || 0;
          return (
            <div className="flex items-center gap-1.5">
              <span className={cn('font-medium', refunded > 0 && 'text-muted-foreground line-through decoration-destructive/60')}>
                {formatAmount(row.original.amount)}
              </span>
              {refunded > 0 && (
                <span className="text-xs font-medium text-destructive">-{formatAmount(refunded)}</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'payment_method',
        header: '支付方式',
        cell: ({ row }) => PAYMENT_METHOD_TEXT[row.original.payment_method] || row.original.payment_method || '-',
      },
      {
        accessorKey: 'status',
        header: '状态',
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant={ORDER_STATUS_BADGE[row.original.status as OrderStatus]}>
              {ORDER_STATUS_TEXT[row.original.status as OrderStatus] || row.original.status}
            </Badge>
            {row.original.refund_status && (
              <Badge variant={ORDER_REFUND_STATUS_BADGE[row.original.refund_status as RefundStatus]}>
                {ORDER_REFUND_STATUS_TEXT[row.original.refund_status as RefundStatus]}
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'created_at',
        header: '创建时间',
        cell: ({ row }) => formatDateTime(row.original.created_at),
      },
      {
        id: 'actions',
        header: '操作',
        cell: ({ row }) => {
          const o = row.original;
          const canRefund = o.status === 'completed' && o.refund_status !== 'full';
          return (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => setDetailOrder(o)}
              >
                <Eye className="h-3.5 w-3.5" /> 详情
              </Button>
              {canRefund && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setRefundOrder(o)}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> 退款
                </Button>
              )}
            </div>
          );
        },
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
        title="订单管理"
        description="查看与管理平台全部支付订单"
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
            placeholder="搜索订单号"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={planType} onValueChange={setPlanType}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLAN_OPTIONS.map((o) => (
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
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center text-muted-foreground">
                  <ShoppingCart className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  暂无订单数据
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="cursor-pointer" onClick={() => setDetailOrder(row.original)}>
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

      <OrderDetailDrawer
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
      />

      <RefundDialog
        order={refundOrder}
        onClose={() => setRefundOrder(null)}
        onSuccess={() => query.refetch()}
      />
    </div>
  );
}
