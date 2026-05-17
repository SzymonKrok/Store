'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import slugify from 'slugify'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AdminCategory } from '@/lib/api/categories'

const schema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana'),
  slug: z.string().min(1, 'Slug jest wymagany'),
  parentId: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  category?: AdminCategory | null
  categories: AdminCategory[]
  onSubmit: (values: { name: string; slug: string; parentId?: string }) => Promise<void>
}

export function CategoryDialog({ open, onClose, category, categories, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '', parentId: '' },
  })

  useEffect(() => {
    if (category) {
      reset({ name: category.name, slug: category.slug, parentId: category.parentId ?? '' })
    } else {
      reset({ name: '', slug: '', parentId: '' })
    }
  }, [category, reset])

  const nameValue = watch('name')
  useEffect(() => {
    if (!category) {
      setValue('slug', slugify(nameValue, { lower: true, strict: true }))
    }
  }, [nameValue, category, setValue])

  async function handleFormSubmit(values: FormValues) {
    await onSubmit({
      name: values.name,
      slug: values.slug,
      parentId: values.parentId || undefined,
    })
    onClose()
  }

  const otherCategories = categories.filter((c) => c.id !== category?.id)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{category ? 'Edytuj kategorię' : 'Nowa kategoria'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Nazwa</Label>
            <Input {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input {...register('slug')} className="font-mono text-sm" />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Kategoria nadrzędna (opcjonalnie)</Label>
            <Select
              value={watch('parentId') || 'none'}
              onValueChange={(v) => setValue('parentId', v === 'none' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Brak (kategoria główna)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Brak</SelectItem>
                {otherCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Anuluj</Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
