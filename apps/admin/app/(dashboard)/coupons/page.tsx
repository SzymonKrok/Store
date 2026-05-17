'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminCoupons, useCreateCoupon, useUpdateCoupon, useSoftDeleteCoupon, useRestoreCoupon } from '@/lib/api/coupons'
import { CouponDialog } from '@/components/coupons/CouponDialog'
import type { AdminCoupon } from '@/lib/api/coupons'

export default function CouponsPage() {
  const { data: coupons = [], isLoading } = useAdminCoupons()
  const { mutateAsync: createCoupon } = useCreateCoupon()
  const { mutateAsync: updateCoupon } = useUpdateCoupon()
  const { mutateAsync: softDelete } = useSoftDeleteCoupon()
  const { mutateAsync: restore } = useRestoreCoupon()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCoupon, setEditCoupon] = useState<AdminCoupon | null>(null)

  async function handleSubmit(payload: unknown) {
    try {
      if (editCoupon) {
        await updateCoupon({ id: editCoupon.id, payload })
        toast.success('Kupon zaktualizowany')
      } else {
        await createCoupon(payload)
        toast.success('Kupon utworzony')
      }
    } catch {
      toast.error('Błąd podczas zapisywania kuponu')
    }
  }

  async function handleSoftDelete(id: string) {
    try {
      await softDelete(id)
      toast.success('Kupon dezaktywowany')
    } catch {
      toast.error('Błąd podczas dezaktywacji kuponu')
    }
  }

  async function handleRestore(id: string) {
    try {
      await restore(id)
      toast.success('Kupon przywrócony')
    } catch {
      toast.error('Błąd podczas przywracania kuponu')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Kupony</h1>
        <Button size="sm" onClick={() => { setEditCoupon(null); setDialogOpen(true) }}>
          <Plus size={16} className="mr-1" />
          Nowy kupon
        </Button>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kod</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Wartość</TableHead>
              <TableHead>Wygasa</TableHead>
              <TableHead>Użycia</TableHead>
              <TableHead>Status</TableHead>
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
              : coupons.map((coupon) => (
                  <TableRow key={coupon.id} className={!coupon.isActive ? 'opacity-50' : ''}>
                    <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {coupon.type === 'PERCENTAGE' ? 'Procent' : 'Kwota'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {coupon.type === 'PERCENTAGE'
                        ? `${coupon.value}%`
                        : `${coupon.value} zł`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {coupon.expiresAt
                        ? format(parseISO(coupon.expiresAt), 'd MMM yyyy', { locale: pl })
                        : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {coupon.usedCount}{coupon.maxUses != null ? `/${coupon.maxUses}` : ''}
                    </TableCell>
                    <TableCell>
                      <Badge className={coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
                        {coupon.isActive ? 'Aktywny' : 'Nieaktywny'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditCoupon(coupon); setDialogOpen(true) }}
                          className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        {coupon.isActive ? (
                          <button
                            onClick={() => handleSoftDelete(coupon.id)}
                            className="p-1.5 text-slate-400 hover:text-destructive transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestore(coupon.id)}
                            className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <CouponDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditCoupon(null) }}
        coupon={editCoupon}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
