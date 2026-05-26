'use client'

import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { AdminOrder } from '@/lib/api/orders'
import { STATUS_LABELS, STATUS_COLORS } from './order-utils'

interface Props {
  orders: AdminOrder[] | undefined
  isLoading: boolean
  onRowClick: (id: string) => void
}

export function OrdersTable({ orders, isLoading, onRowClick }: Props) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-stone-50 hover:bg-stone-50">
            <TableHead className="text-stone-500 font-medium">ID</TableHead>
            <TableHead className="text-stone-500 font-medium">Klient</TableHead>
            <TableHead className="text-stone-500 font-medium">Typ</TableHead>
            <TableHead className="text-stone-500 font-medium">Data</TableHead>
            <TableHead className="text-stone-500 font-medium">Dostawa</TableHead>
            <TableHead className="text-stone-500 font-medium">Status</TableHead>
            <TableHead className="text-right text-stone-500 font-medium">Kwota</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : orders?.length === 0
            ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-stone-400 text-sm py-12">
                  Brak zamówień pasujących do filtrów
                </TableCell>
              </TableRow>
            )
            : orders?.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-stone-50 border-stone-100"
                  onClick={() => onRowClick(order.id)}
                >
                  <TableCell className="font-mono text-xs text-stone-400">
                    #{order.id.slice(-8).toUpperCase()}
                  </TableCell>
                  <TableCell className="text-sm text-stone-700 max-w-[180px] truncate">
                    {order.user?.email ?? order.guestEmail ?? '—'}
                  </TableCell>
                  <TableCell>
                    {order.userId ? (
                      <Badge className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-50 text-xs font-normal">Konto</Badge>
                    ) : (
                      <Badge className="bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-100 text-xs font-normal">Gość</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-stone-500 whitespace-nowrap">
                    {format(parseISO(order.createdAt), 'd MMM yyyy, HH:mm', { locale: pl })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-normal border-stone-200 text-stone-500">
                      {order.deliveryMethod === 'COURIER' ? 'Kurier' : 'Paczkomat'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs font-normal ${STATUS_COLORS[order.status] ?? ''}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-medium text-stone-800">
                    {Number(order.total).toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  )
}
