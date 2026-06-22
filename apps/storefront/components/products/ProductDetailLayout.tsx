'use client'

import { useMemo, useState } from 'react'
import { ImageGallery } from './ImageGallery'
import { ProductInfo } from './ProductInfo'
import type { ProductDetail } from '@/lib/api/products'

interface Props {
  product: ProductDetail
  showQuantitySelector: boolean
  showStockBadge: boolean
}

export function ProductDetailLayout({ product, showQuantitySelector, showStockBadge }: Props) {
  const attributeKeys = useMemo(() => {
    const allKeys = new Set<string>()
    for (const v of product.variants) {
      for (const k of Object.keys(v.attributes)) allKeys.add(k)
    }
    return [...allKeys]
  }, [product.variants])

  const initialVariant = useMemo(() => {
    const hasAllKeys = (v: (typeof product.variants)[0]) =>
      attributeKeys.every((k) => v.attributes[k])
    return (
      product.variants.find((v) => v.stock > 0 && hasAllKeys(v)) ??
      product.variants.find((v) => hasAllKeys(v)) ??
      product.variants.find((v) => v.stock > 0) ??
      product.variants[0]
    )
  }, [product.variants, attributeKeys])

  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(
    () => initialVariant?.attributes ?? {},
  )

  const galleryImages = useMemo(() => {
    const sorted = product.images.slice().sort((a, b) => a.position - b.position)
    const defaults = sorted.filter((i) => !i.attributeValue)
    if (!product.imageAttributeKey) return defaults
    const val = selectedAttrs[product.imageAttributeKey]
    if (!val) return defaults
    const matching = sorted.filter((i) => i.attributeValue === val)
    return matching.length > 0 ? matching : defaults
  }, [product.images, product.imageAttributeKey, selectedAttrs])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <ImageGallery images={galleryImages} />
      <ProductInfo
        product={product}
        selectedAttrs={selectedAttrs}
        onSelectedAttrsChange={setSelectedAttrs}
        attributeKeys={attributeKeys}
        showQuantitySelector={showQuantitySelector}
        showStockBadge={showStockBadge}
      />
    </div>
  )
}
