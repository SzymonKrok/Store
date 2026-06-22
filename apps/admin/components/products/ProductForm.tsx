'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
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
import { MarkdownEditor } from './MarkdownEditor'
import { SpecificationsEditor, type SpecRow } from './SpecificationsEditor'
import type { AdminProduct } from '@/lib/api/products'
import type { AdminCategory } from '@/lib/api/categories'

const schema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana'),
  slug: z.string().min(1, 'Slug jest wymagany'),
  shortDescription: z.string().optional(),
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

interface ProductImageState {
  url: string
  attributeValue: string | null
}

const NO_GROUPING = '__none__'

function emptyVariant(keys: string[]): VariantData {
  const attributes = Object.fromEntries(keys.map((k) => [k, '']))
  return { sku: '', price: '', compareAtPrice: '', stock: '0', attributes, isActive: true }
}

function deriveKeys(variants: AdminProduct['variants'] | undefined): string[] {
  if (!variants || variants.length === 0) return []
  const allKeys = new Set<string>()
  for (const v of variants) {
    for (const k of Object.keys(v.attributes ?? {})) allKeys.add(k)
  }
  return [...allKeys]
}

export function ProductForm({ product, categories, onSubmit }: Props) {
  const router = useRouter()

  const [attributeKeys, setAttributeKeys] = useState<string[]>(() => deriveKeys(product?.variants))
  const [newKeyInput, setNewKeyInput] = useState('')

  const [variants, setVariants] = useState<VariantData[]>(
    product?.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      price: v.price,
      compareAtPrice: v.compareAtPrice ?? '',
      stock: String(v.stock),
      attributes: v.attributes,
      isActive: v.isActive,
    })) ?? [emptyVariant([])],
  )

  const [keyFeatures, setKeyFeatures] = useState<string[]>(product?.keyFeatures ?? [])
  const [newFeatureInput, setNewFeatureInput] = useState('')

  const [specs, setSpecs] = useState<SpecRow[]>(
    product?.specifications
      ? Object.entries(product.specifications).map(([key, value]) => ({ key, value }))
      : [],
  )

  const [imageAttributeKey, setImageAttributeKey] = useState<string | null>(
    product?.imageAttributeKey ?? null,
  )
  const [images, setImages] = useState<ProductImageState[]>(
    product?.images
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ url: i.url, attributeValue: i.attributeValue ?? null })) ?? [],
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
      shortDescription: product?.shortDescription ?? '',
      description: product?.description ?? '',
      basePrice: product?.basePrice ?? '',
      categoryId: product?.categoryId ?? '',
    },
  })

  const nameValue = watch('name')

  useEffect(() => {
    if (!product) {
      const generated = slugify(nameValue, { lower: true, strict: true })
      setValue('slug', generated)
    }
  }, [nameValue, product, setValue])

  // Distinct non-empty values for the chosen image attribute, gathered from variants
  const imageGroupValues = useMemo(() => {
    if (!imageAttributeKey) return [] as string[]
    const values = new Set<string>()
    for (const v of variants) {
      const val = v.attributes[imageAttributeKey]
      if (val) values.add(val)
    }
    return [...values]
  }, [variants, imageAttributeKey])

  function imagesForGroup(value: string | null): string[] {
    return images.filter((i) => i.attributeValue === value).map((i) => i.url)
  }

  function setImagesForGroup(value: string | null, urls: string[]) {
    setImages((prev) => {
      const others = prev.filter((i) => i.attributeValue !== value)
      const updated = urls.map((url) => ({ url, attributeValue: value }))
      return [...others, ...updated]
    })
  }

  function addAttributeKey() {
    const key = newKeyInput.trim()
    if (!key || attributeKeys.includes(key)) return
    setAttributeKeys((prev) => [...prev, key])
    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        attributes: v.attributes[key] !== undefined ? v.attributes : { ...v.attributes, [key]: '' },
      })),
    )
    setNewKeyInput('')
  }

  function removeAttributeKey(key: string) {
    setAttributeKeys((prev) => prev.filter((k) => k !== key))
    setVariants((prev) =>
      prev.map((v) => {
        const attrs = { ...v.attributes }
        delete attrs[key]
        return { ...v, attributes: attrs }
      }),
    )
    // If we removed the attribute that drives images, unset that too
    if (imageAttributeKey === key) {
      setImageAttributeKey(null)
      // Move any tagged images back to default
      setImages((prev) => prev.map((img) => ({ ...img, attributeValue: null })))
    }
  }

  function updateVariant(index: number, v: VariantData) {
    setVariants((prev) => prev.map((item, i) => (i === index ? v : item)))
  }

  function deleteVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index))
  }

  function addVariant() {
    setVariants((prev) => [...prev, emptyVariant(attributeKeys)])
  }

  function addKeyFeature() {
    const f = newFeatureInput.trim()
    if (!f || keyFeatures.includes(f)) return
    setKeyFeatures((prev) => [...prev, f])
    setNewFeatureInput('')
  }

  function removeKeyFeature(i: number) {
    setKeyFeatures((prev) => prev.filter((_, idx) => idx !== i))
  }

  function handleImageAttributeChange(next: string) {
    const newKey = next === NO_GROUPING ? null : next
    setImageAttributeKey(newKey)
    // When turning grouping off, demote every tagged image to default
    if (!newKey) {
      setImages((prev) => prev.map((img) => ({ ...img, attributeValue: null })))
    }
  }

  async function handleFormSubmit(values: FormValues) {
    if (variants.length === 0) {
      toast.error('Dodaj co najmniej jeden wariant')
      return
    }
    setIsSubmitting(true)
    try {
      // Filter out empty spec rows; keep only entries with both a key and a value
      const specsMap = specs.reduce<Record<string, string>>((acc, row) => {
        const k = row.key.trim()
        const v = row.value.trim()
        if (k && v) acc[k] = v
        return acc
      }, {})

      await onSubmit({
        ...values,
        shortDescription: values.shortDescription?.trim() || null,
        keyFeatures: keyFeatures.filter((f) => f.trim().length > 0),
        specifications: Object.keys(specsMap).length > 0 ? specsMap : null,
        basePrice: Number(values.basePrice),
        imageAttributeKey,
        images: images.map((img, i) => ({
          url: img.url,
          position: i,
          attributeValue: img.attributeValue,
        })),
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
                <Label htmlFor="shortDescription">Krótki opis</Label>
                <Textarea
                  id="shortDescription"
                  rows={2}
                  placeholder="Jedno-dwa zdania pokazywane nad ceną"
                  {...register('shortDescription')}
                />
                <p className="text-[11px] text-cream-muted">
                  Pojawia się na stronie produktu pod nazwą i ceną. Zostaw puste, jeżeli nie potrzebujesz.
                </p>
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
            <CardContent className="space-y-4">
              {/* Attribute key manager */}
              <div className="p-3 bg-ink-700 rounded-lg border border-ink-600 space-y-2">
                <p className="text-xs font-medium text-cream/90">
                  Atrybuty wariantów
                  <span className="ml-1 font-normal text-cream-muted">(np. Rozmiar, Kolor)</span>
                </p>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {attributeKeys.map((key) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ink-600 border border-ink-500 text-xs text-cream/90 font-medium"
                    >
                      {key}
                      <button
                        type="button"
                        onClick={() => removeAttributeKey(key)}
                        className="text-cream-muted hover:text-red-400 transition-colors"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <Input
                      value={newKeyInput}
                      onChange={(e) => setNewKeyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addAttributeKey()
                        }
                      }}
                      placeholder="Nowy atrybut…"
                      className="h-7 text-xs w-36"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2"
                      onClick={addAttributeKey}
                    >
                      <Plus size={12} />
                    </Button>
                  </div>
                </div>
              </div>

              {variants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Brak wariantów. Dodaj co najmniej jeden.
                </p>
              ) : (
                <div>
                  <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: `1fr 1fr 1fr 80px${attributeKeys.map(() => ' 1fr').join('')} auto auto` }}>
                    {['SKU', 'Cena', 'Cena przed', 'Stan', ...attributeKeys, 'Aktywny', ''].map((h) => (
                      <span key={h} className="text-xs font-medium text-muted-foreground">{h}</span>
                    ))}
                  </div>
                  {variants.map((v, i) => (
                    <VariantRow
                      key={i}
                      variant={v}
                      index={i}
                      attributeKeys={attributeKeys}
                      onChange={updateVariant}
                      onDelete={deleteVariant}
                      canDelete={variants.length > 1}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Najważniejsze cechy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-cream-muted">
                Krótkie wypunktowane korzyści pokazywane na stronie produktu obok ceny.
              </p>
              {keyFeatures.length > 0 && (
                <ul className="space-y-1.5">
                  {keyFeatures.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 px-3 py-1.5 bg-ink-700 rounded-md text-sm text-cream/90"
                    >
                      <span className="flex-1">{feature}</span>
                      <button
                        type="button"
                        onClick={() => removeKeyFeature(i)}
                        className="text-cream-muted hover:text-red-400 transition-colors"
                        aria-label="Usuń cechę"
                      >
                        <X size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <Input
                  value={newFeatureInput}
                  onChange={(e) => setNewFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addKeyFeature()
                    }
                  }}
                  placeholder="np. 144 Hz, USB-C 90W…"
                  className="text-sm"
                />
                <Button type="button" size="sm" variant="outline" onClick={addKeyFeature}>
                  <Plus size={14} className="mr-1" />
                  Dodaj
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Full description (markdown) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pełny opis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-cream-muted">
                Długi opis produktu pisany w formacie Markdown. Widoczny w sekcji „Opis" na karcie produktu.
              </p>
              <MarkdownEditor
                value={watch('description') ?? ''}
                onChange={(v) => setValue('description', v)}
                rows={12}
                placeholder={'## Wytrzymały, lekki, wszechstronny\n\nNasz produkt łączy...\n\n- Cecha 1\n- Cecha 2'}
              />
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Specyfikacja</CardTitle>
            </CardHeader>
            <CardContent>
              <SpecificationsEditor rows={specs} onChange={setSpecs} />
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Zdjęcia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image grouping selector */}
              <div className="space-y-1.5">
                <Label className="text-xs">Galeria zależna od atrybutu</Label>
                <Select
                  value={imageAttributeKey ?? NO_GROUPING}
                  onValueChange={handleImageAttributeChange}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_GROUPING}>Brak — wspólna galeria</SelectItem>
                    {attributeKeys.map((k) => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {imageAttributeKey && (
                  <p className="text-[11px] text-cream-muted">
                    Galeria przełącza się, gdy klient zmieni „{imageAttributeKey}".
                  </p>
                )}
              </div>

              {imageAttributeKey ? (
                <div className="space-y-4">
                  {imageGroupValues.length === 0 ? (
                    <p className="text-xs text-cream-muted italic">
                      Brak wartości dla atrybutu „{imageAttributeKey}". Uzupełnij wartości w wariantach.
                    </p>
                  ) : (
                    imageGroupValues.map((val) => (
                      <div key={val} className="space-y-1.5">
                        <Label className="text-xs font-medium">
                          {imageAttributeKey}: <span className="text-cream">{val}</span>
                        </Label>
                        <ImageUploadZone
                          images={imagesForGroup(val)}
                          onChange={(urls) => setImagesForGroup(val, urls)}
                        />
                      </div>
                    ))
                  )}
                  <div className="space-y-1.5 pt-2 border-t border-ink-700">
                    <Label className="text-xs font-medium text-cream-muted">
                      Domyślne (pokazywane, gdy brak zdjęć dla wybranego „{imageAttributeKey}")
                    </Label>
                    <ImageUploadZone
                      images={imagesForGroup(null)}
                      onChange={(urls) => setImagesForGroup(null, urls)}
                    />
                  </div>
                </div>
              ) : (
                <ImageUploadZone
                  images={imagesForGroup(null)}
                  onChange={(urls) => setImagesForGroup(null, urls)}
                />
              )}
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
