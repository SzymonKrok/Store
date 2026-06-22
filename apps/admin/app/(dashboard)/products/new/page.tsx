'use client'

import { useCategories } from '@/lib/api/categories'
import { useCreateProduct } from '@/lib/api/products'
import { ProductForm } from '@/components/products/ProductForm'

export default function NewProductPage() {
  const { data: categories = [] } = useCategories()
  const { mutateAsync: createProduct } = useCreateProduct()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-cream">Nowy produkt</h1>
      <ProductForm categories={categories} onSubmit={createProduct} />
    </div>
  )
}
