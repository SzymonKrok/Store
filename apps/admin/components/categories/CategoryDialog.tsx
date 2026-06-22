'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import slugify from 'slugify'
import axios from 'axios'
import { ImageIcon, X, Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiClient } from '@/lib/axios'
import type { AdminCategory, CategoryPayload } from '@/lib/api/categories'

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
  onSubmit: (values: CategoryPayload) => Promise<void>
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

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (category) {
      reset({ name: category.name, slug: category.slug, parentId: category.parentId ?? '' })
      setImageUrl(category.imageUrl ?? null)
    } else {
      reset({ name: '', slug: '', parentId: '' })
      setImageUrl(null)
    }
  }, [category, reset])

  const nameValue = watch('name')
  useEffect(() => {
    if (!category) {
      setValue('slug', slugify(nameValue, { lower: true, strict: true }))
    }
  }, [nameValue, category, setValue])

  async function handleImageFile(file: File) {
    setUploading(true)
    try {
      const { data } = await apiClient.post<{ uploadUrl: string; publicUrl: string }>(
        '/upload/presign',
        { filename: file.name, contentType: file.type },
      )
      await axios.put(data.uploadUrl, file, { headers: { 'Content-Type': file.type } })
      setImageUrl(data.publicUrl)
    } finally {
      setUploading(false)
    }
  }

  async function handleFormSubmit(values: FormValues) {
    await onSubmit({
      name: values.name,
      slug: values.slug,
      parentId: values.parentId || undefined,
      imageUrl: imageUrl ?? undefined,
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

          {/* Image upload */}
          <div className="space-y-1.5">
            <Label>Zdjęcie kategorii (opcjonalnie)</Label>
            <div className="flex gap-3 items-start">
              <div className="shrink-0 w-16 h-16 rounded-xl border border-border bg-ink-700 overflow-hidden flex items-center justify-center">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={20} className="text-cream-muted" />
                )}
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => inputRef.current?.click()}
                  className="h-8 px-3 text-xs border border-border rounded-lg bg-ink-700 text-cream hover:bg-ink-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <Upload size={12} />
                  {uploading ? 'Przesyłanie…' : 'Wgraj zdjęcie'}
                </button>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="h-8 px-3 text-xs border border-border rounded-lg bg-ink-700 text-red-400 hover:bg-ink-600 transition-colors flex items-center gap-1.5"
                  >
                    <X size={12} />
                    Usuń zdjęcie
                  </button>
                )}
              </div>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
            />
          </div>

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
            <Button type="submit" className="flex-1" disabled={isSubmitting || uploading}>
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
