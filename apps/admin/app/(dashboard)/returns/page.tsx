'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useRouter } from 'next/navigation'
import { useAdminReturns, useUpdateReturnStatus, type ReturnStatus } from '@/lib/api/returns'

const STATUS_LABELS: Record<ReturnStatus, string> = {
  RETURN_REQUESTED: 'Złożony',
  RETURN_APPROVED: 'Zatwierdzony',
  REFUNDED: 'Zwrócono środki',
}

const STATUS_COLORS: Record<ReturnStatus, string> = {
  RETURN_REQUESTED: 'bg-amber-100 text-amber-700',
  RETURN_APPROVED: 'bg-blue-950/40 text-blue-300',
  REFUNDED: 'bg-green-100 text-green-700',
}

const ALL_STATUSES: ReturnStatus[] = ['RETURN_REQUESTED', 'RETURN_APPROVED', 'REFUNDED']

export default function ReturnsPage() {
  const [page, setPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const router = useRouter()

  const { data, isLoading } = useAdminReturns(page, filterStatus || undefined)
  const { mutateAsync: updateStatus } = useUpdateReturnStatus()

  async function handleStatusChange(id: string, status: ReturnStatus) {
    try {
      await updateStatus({ id, status })
      toast.success('Status zwrotu zaktualizowany')
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(msg ?? 'Błąd podczas aktualizacji statusu')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-cream">Zwroty</h1>

        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1) }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Wszystkie statusy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Wszystkie statusy</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Zamówienie</TableHead>
              <TableHead>Klient</TableHead>
              <TableHead>IBAN</TableHead>
              <TableHead>Powód</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-44">Zmień status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : data?.items.map((rr) => (
                  <TableRow key={rr.id}>
                    <TableCell>
                      <Badge className={STATUS_COLORS[rr.status]}>
                        {STATUS_LABELS[rr.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => router.push(`/orders/${rr.order.id}`)}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        #{rr.order.id.slice(0, 8).toUpperCase()}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-cream/70">
                      {rr.order.user?.email ?? rr.order.guestEmail ?? '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-cream/70">
                      {rr.bankAccount}
                    </TableCell>
                    <TableCell className="text-sm text-cream/70 max-w-[200px] truncate">
                      {rr.reason}
                    </TableCell>
                    <TableCell className="text-sm text-cream-muted whitespace-nowrap">
                      {format(parseISO(rr.createdAt), 'd MMM yyyy', { locale: pl })}
                    </TableCell>
                    <TableCell>
                      {rr.status === 'REFUNDED' ? (
                        <span className="text-xs text-cream-muted italic">Zakończony</span>
                      ) : (
                        <Select
                          value={rr.status}
                          onValueChange={(v) => handleStatusChange(rr.id, v as ReturnStatus)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_STATUSES.filter((s) => s !== 'REFUNDED' || rr.status === 'RETURN_APPROVED').map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">
                                {STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-cream-muted text-sm py-10">
                  Brak wniosków zwrotu
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-disabled={page === 1}
                className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                aria-disabled={page === data.totalPages}
                className={page === data.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

    </div>
  )
}
