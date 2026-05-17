'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import slugify from 'slugify'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUploadZone } from './ImageUploadZone'
import { VariantRow } from './VariantRow'
import type { VariantData } from './VariantRow'
import type { AdminProduct } from '@/lib/api/products'
import type { AdminCategory } from '@/lib/api/categories'

const schema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana'),
  slug: z.string().min(1, 'Slug jest wymagany'),
  description: z.string().optional(),
  basePrice: z.string().min(1, 'Cena jest wymagana'),
  categoryId: z.string().min(1, 'Kategoria jest wymagana'),
})
type FormValues = z.infer<typeof schema>

interface Props {
  product?: AdminProduct
  categories: AdminCategory[]
  onSubmit: (payload: unknown) => Promise<unknown>
}

function emptyVariant(): VariantData {
  return { sku: '', price: '', compareAtPrice: '', stock: '0', attributes: {}, isActive: true }
}

export function ProductForm({ product, categories, onSubmit }: Props) {
  const router = useRouter()
  const [variants, setVariants] = useState<VariantData[]>(
    product?.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      price: v.price,
      compareAtPrice: v.compareAtPrice ?? '',
      stock: String(v.stock),
      attributes: v.attributes,
      isActive: v.isActive,
    })) ?? [emptyVariant()],
  )
  const [images, setImages] = useState<string[]>(
    product?.images.sort((a, b) => a.position - b.position).map((i) => i.url) ?? [],
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? '',
      slug: product?.slug ?? '',
      description: product?.description ?? '',
      basePrice: product?.basePrice ?? '',
      categoryId: product?.categoryId ?? '',
    },
  })

  const nameValue = watch('name')

  // Auto-generate slug from name (only if slug is empty or matches previous auto-generated value)
  useEffect(() => {
    if (!product) {
      const generated = slugify(nameValue, { lower: true, strict: true })
      setValue('slug', generated)
    }
  }, [nameValue, product, setValue])

  function updateVariant(index: number, v: VariantData) {
    setVariants((prev) => prev.map((item, i) => (i === index ? v : item)))
  }

  function deleteVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index))
  }

  function addVariant() {
    setVariants((prev) => [...prev, emptyVariant()])
  }

  async function handleFormSubmit(values: FormValues) {
    if (variants.length === 0) {
      toast.error('Dodaj co najmniej jeden wariant')
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit({
        ...values,
        basePrice: Number(values.basePrice),
        images: images.map((url, i) => ({ url, position: i })),
        variants: variants.map((v) => ({
          ...(v.id ? { id: v.id } : {}),
          sku: v.sku,
          price: Number(v.price),
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
          stock: Number(v.stock),
          attributes: v.attributes,
          isActive: v.isActive,
        })),
      })
      toast.success(product ? 'Produkt zaktualizowany' : 'Produkt utworzony')
      router.push('/products')
    } catch {
      toast.error('Błąd podczas zapisywania produktu')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dane produktu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nazwa</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" {...register('slug')} className="font-mono text-sm" />
                {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Opis</Label>
                <Textarea id="description" rows={4} {...register('description')} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="basePrice">Cena bazowa (zł)</Label>
                  <Input id="basePrice" type="number" step="0.01" min="0" {...register('basePrice')} />
                  {errors.basePrice && <p className="text-xs text-destructive">{errors.basePrice.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>Kategoria</Label>
                  <Select
                    value={watch('categoryId')}
                    onValueChange={(v) => setValue('categoryId', v, { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz kategorię" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variants */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Warianty</CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={addVariant}>
                <Plus size={14} className="mr-1" />
                Dodaj wariant
              </Button>
            </CardHeader>
            <CardContent>
              {variants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Brak wariantów. Dodaj co najmniej jeden.
                </p>
              ) : (
                <div>
                  <div className="grid grid-cols-[1fr_1fr_1fr_80px_1fr_auto_auto] gap-2 mb-2">
                    {['SKU', 'Cena', 'Cena przed', 'Stan', 'Atrybuty', 'Aktywny', ''].map((h) => (
                      <span key={h} className="text-xs font-medium text-muted-foreground">{h}</span>
                    ))}
                  </div>
                  {variants.map((v, i) => (
                    <VariantRow
                      key={i}
                      variant={v}
                      index={i}
                      onChange={updateVariant}
                      onDelete={deleteVariant}
                      canDelete={variants.length > 1}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Zdjęcia</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploadZone images={images} onChange={setImages} />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => router.push('/products')}>
              Anuluj
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Zapisywanie...' : product ? 'Zapisz zmiany' : 'Utwórz produkt'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
