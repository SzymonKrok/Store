'use client'

import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { AdminOrder } from '@/lib/api/orders'
import { ORDER_STATUSES, STATUS_LABELS, STATUS_COLORS } from './order-utils'

interface Props {
  orders: AdminOrder[] | undefined
  isLoading: boolean
  onRowClick: (id: string) => void
  statusFilter: string
  onStatusFilter: (v: string) => void
}

export function OrdersTable({ orders, isLoading, onRowClick, statusFilter, onStatusFilter }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={onStatusFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Wszystkie statusy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Wszystkie statusy</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Klient</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Dostawa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Kwota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : orders?.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => onRowClick(order.id)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.user?.email ?? order.guestEmail ?? '—'}
                    </TableCell>
                    <TableCell>
                      {order.userId ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Konto</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 text-xs">Gość</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(parseISO(order.createdAt), 'd MMM yyyy, HH:mm', { locale: pl })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {order.deliveryMethod === 'COURIER' ? 'Kurier' : 'Paczkomat'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${STATUS_COLORS[order.status] ?? ''}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">
                      {Number(order.total).toLocaleString('pl-PL')} zł
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
