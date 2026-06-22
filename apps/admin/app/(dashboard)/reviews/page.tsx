'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Star, Check, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { useAdminReviews, useApproveReview, useDeleteReview } from '@/lib/api/reviews'

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          strokeWidth={1.5}
          className={n <= value ? 'text-amber-400 fill-amber-400' : 'text-ink-600 fill-ink-600'}
        />
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<string>('pending')

  const approvedParam =
    filter === 'approved' ? true : filter === 'pending' ? false : undefined

  const { data, isLoading } = useAdminReviews(page, approvedParam)
  const { mutateAsync: approve } = useApproveReview()
  const { mutateAsync: deleteReview } = useDeleteReview()

  async function handleApprove(id: string) {
    try {
      await approve(id)
      toast.success('Opinia zatwierdzona')
    } catch {
      toast.error('Błąd podczas zatwierdzania')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteReview(id)
      toast.success('Opinia usunięta')
    } catch {
      toast.error('Błąd podczas usuwania')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-cream">Opinie</h1>
          {data && (
            <p className="text-sm text-cream-muted mt-1">
              {data.total} {data.total === 1 ? 'opinia' : data.total < 5 ? 'opinie' : 'opinii'}
            </p>
          )}
        </div>

        <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1) }}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Oczekujące</SelectItem>
            <SelectItem value="approved">Zatwierdzone</SelectItem>
            <SelectItem value="all">Wszystkie</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Status</TableHead>
              <TableHead>Produkt</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead className="w-28">Ocena</TableHead>
              <TableHead>Komentarz</TableHead>
              <TableHead className="w-32">Data</TableHead>
              <TableHead className="w-24">Akcje</TableHead>
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
              : data?.items.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <Badge className={review.approved
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                      }>
                        {review.approved ? 'Zatwierdzona' : 'Oczekuje'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-cream/90 max-w-[140px] truncate">
                      {review.product.name}
                    </TableCell>
                    <TableCell className="text-sm text-cream/90 font-medium">
                      {review.authorName}
                    </TableCell>
                    <TableCell>
                      <StarDisplay value={review.rating} />
                    </TableCell>
                    <TableCell className="text-sm text-cream-muted max-w-[260px]">
                      <span className="line-clamp-2">{review.comment}</span>
                    </TableCell>
                    <TableCell className="text-sm text-cream-muted whitespace-nowrap">
                      {format(parseISO(review.createdAt), 'd MMM yyyy', { locale: pl })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {!review.approved && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleApprove(review.id)}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Zatwierdź"
                          >
                            <Check size={15} />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(review.id)}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          title="Usuń"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-cream-muted text-sm py-12">
                  {filter === 'pending' ? 'Brak oczekujących opinii' : 'Brak opinii'}
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
