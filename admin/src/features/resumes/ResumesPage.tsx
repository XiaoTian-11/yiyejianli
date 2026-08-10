import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { Search, RefreshCw, Loader2, FileText } from 'lucide-react';
import { api, type PageResult } from '@/lib/api';
import { PageHeader } from '@/features/shared/PageHeader';
import { DataTablePagination } from '@/features/shared/DataTablePagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import type { AdminResumeRow } from '@/types';
import { RESUME_STATUS_TEXT } from '@/types';

export function ResumesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const query = useQuery({
    queryKey: ['admin', 'resumes', { search: debouncedSearch, page, pageSize }],
    queryFn: () =>
      api.get<PageResult<AdminResumeRow>>(
        `/resumes?search=${encodeURIComponent(debouncedSearch)}&page=${page}&pageSize=${pageSize}`
      ),
  });

  const columns = useMemo<ColumnDef<AdminResumeRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: '简历名称',
        cell: ({ row }) => <p className="font-medium">{row.original.name || '未命名简历'}</p>,
      },
      {
        accessorKey: 'user_email',
        header: '所属用户',
        cell: ({ row }) => row.original.user_email || row.original.user_id,
      },
      {
        accessorKey: 'template_id',
        header: '模板',
        cell: ({ row }) => row.original.template_id || '-',
      },
      {
        accessorKey: 'score',
        header: '评分',
        cell: ({ row }) => (
          <Badge variant={row.original.score >= 80 ? 'success' : row.original.score >= 60 ? 'warning' : 'muted'}>
            {row.original.score}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: '状态',
        cell: ({ row }) => (
          <Badge variant="outline">{RESUME_STATUS_TEXT[row.original.status] || row.original.status}</Badge>
        ),
      },
      {
        accessorKey: 'updated_at',
        header: '更新时间',
        cell: ({ row }) => formatDateTime(row.original.updated_at),
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
        title="简历管理"
        description="查看平台全部用户简历（只读）"
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
            placeholder="按用户邮箱搜索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
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
                  <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  暂无简历数据
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
    </div>
  );
}
