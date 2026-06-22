'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/lib/api/categories'
import { CategoryDialog } from '@/components/categories/CategoryDialog'
import type { AdminCategory } from '@/lib/api/categories'

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories()
  const { mutateAsync: createCategory } = useCreateCategory()
  const { mutateAsync: updateCategory } = useUpdateCategory()
  const { mutateAsync: deleteCategory } = useDeleteCategory()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<AdminCategory | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function handleSubmit(values: { name: string; slug: string; parentId?: string; imageUrl?: string }) {
    try {
      if (editCategory) {
        await updateCategory({ id: editCategory.id, payload: values })
        toast.success('Kategoria zaktualizowana')
      } else {
        await createCategory(values)
        toast.success('Kategoria utworzona')
      }
    } catch {
      toast.error('Błąd podczas zapisywania kategorii')
      throw new Error('save failed')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCategory(id)
      toast.success('Kategoria usunięta')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        toast.error('Kategoria zawiera produkty. Najpierw przenieś produkty do innej kategorii.')
      } else {
        toast.error('Błąd podczas usuwania kategorii')
      }
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-cream">Kategorie</h1>
        <Button size="sm" onClick={() => { setEditCategory(null); setDialogOpen(true) }}>
          <Plus size={16} className="mr-1" />
          Nowa kategoria
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Zdjęcie</TableHead>
              <TableHead>Nazwa</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Nadrzędna</TableHead>
              <TableHead className="w-20">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>
                      {cat.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cat.imageUrl} alt={cat.name} className="w-9 h-9 rounded-lg object-cover border border-border" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-ink-700 border border-border" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{cat.slug}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {cat.parent?.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditCategory(cat); setDialogOpen(true) }}
                          className="p-1.5 text-cream-muted hover:text-primary transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(cat.id)}
                          className="p-1.5 text-cream-muted hover:text-destructive transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <CategoryDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditCategory(null) }}
        category={editCategory}
        categories={categories}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń kategorię</AlertDialogTitle>
            <AlertDialogDescription>
              Tej operacji nie można cofnąć. Jeśli kategoria zawiera produkty, usunięcie będzie niemożliwe.
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
    </div>
  )
}
