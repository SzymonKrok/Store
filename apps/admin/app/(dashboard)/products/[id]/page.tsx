'use client'

import { use } from 'react'
import { useCategories } from '@/lib/api/categories'
import { useAdminProduct, useUpdateProduct } from '@/lib/api/products'
import { ProductForm } from '@/components/products/ProductForm'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: product, isLoading } = useAdminProduct(id)
  const { data: categories = [] } = useCategories()
  const { mutateAsync: updateProduct } = useUpdateProduct()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  if (!product) return <p className="text-muted-foreground">Produkt nie znaleziony</p>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-cream">Edytuj produkt</h1>
      <ProductForm
        product={product}
        categories={categories}
        onSubmit={(payload) => updateProduct({ id, payload })}
      />
    </div>
  )
}
