'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { AdminProduct } from '@/lib/api/products'
import { useDeleteProduct, useArchiveProduct } from '@/lib/api/products'

interface Props {
  products: AdminProduct[] | undefined
  isLoading: boolean
}

export function ProductsTable({ products, isLoading }: Props) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { mutateAsync: deleteProduct } = useDeleteProduct()
  const { mutateAsync: archiveProduct } = useArchiveProduct()

  async function handleDelete(id: string) {
    try {
      await deleteProduct(id)
      toast.success('Produkt usunięty')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        toast('Ten produkt był zamówiony i nie może zostać trwale usunięty. Czy chcesz go zarchiwizować?', {
          action: {
            label: 'Archiwizuj',
            onClick: () => archiveProduct(id).then(() => toast.success('Produkt zarchiwizowany')),
          },
        })
      } else {
        toast.error('Błąd podczas usuwania produktu')
      }
    } finally {
      setDeleteId(null)
    }
  }

  function getStockStatus(product: AdminProduct) {
    const variants = product.variants.filter((v) => v.isActive)
    if (variants.some((v) => v.stock === 0)) return 'out'
    if (variants.some((v) => v.stock <= 5)) return 'low'
    return 'ok'
  }

  function getPriceRange(product: AdminProduct) {
    const prices = product.variants.map((v) => Number(v.price))
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    return min === max
      ? `${min.toLocaleString('pl-PL')} zł`
      : `${min.toLocaleString('pl-PL')}–${max.toLocaleString('pl-PL')} zł`
  }

  const stockColors = { ok: 'bg-green-100 text-green-700', low: 'bg-amber-100 text-amber-700', out: 'bg-red-100 text-red-700' }
  const stockLabels = { ok: 'OK', low: 'Niski', out: 'Brak' }

  return (
    <>
      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nazwa</TableHead>
              <TableHead>Kategoria</TableHead>
              <TableHead>Warianty</TableHead>
              <TableHead>Cena</TableHead>
              <TableHead>Stan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : products?.map((product) => {
                  const stock = getStockStatus(product)
                  return (
                    <TableRow key={product.id} className={!product.isActive ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{product.category.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{product.variants.length}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{getPriceRange(product)}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${stockColors[stock]}`}>{stockLabels[stock]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${!product.isActive ? 'bg-slate-100 text-slate-500' : ''}`}>
                          {product.isActive ? 'Aktywny' : 'Archiwum'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <button
                            onClick={() => router.push(`/products/${product.id}`)}
                            className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteId(product.id)}
                            className="p-1.5 text-slate-400 hover:text-destructive transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń produkt</AlertDialogTitle>
            <AlertDialogDescription>
              Tej operacji nie można cofnąć. Produkt zostanie trwale usunięty.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
