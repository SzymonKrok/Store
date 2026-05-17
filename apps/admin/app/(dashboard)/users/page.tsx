'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useAdminUsers } from '@/lib/api/users'
import { UserSheet } from '@/components/users/UserSheet'

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const { data, isLoading } = useAdminUsers(page)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Użytkownicy</h1>

      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Rola</TableHead>
              <TableHead>Data rejestracji</TableHead>
              <TableHead>Zamówienia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : data?.users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={user.role === 'ADMIN' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(parseISO(user.createdAt), 'd MMM yyyy', { locale: pl })}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{user.orderCount}</TableCell>
                  </TableRow>
                ))}
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

      <UserSheet userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
    </div>
  )
}
