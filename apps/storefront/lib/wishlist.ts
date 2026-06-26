'use client'

import { useState, useEffect, useCallback } from 'react'

export type WishlistItem = {
  id: string
  slug: string
  name: string
  price: string
  imageUrl: string | null
}

const WISHLIST_KEY = 'lune_wishlist'

function readWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? '[]')
    if (!Array.isArray(raw)) return []
    // Filter out legacy string entries (old format stored only IDs)
    return raw.filter(
      (item): item is WishlistItem =>
        typeof item === 'object' && item !== null && typeof item.id === 'string',
    )
  } catch {
    return []
  }
}

function writeWishlist(items: WishlistItem[]) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('wishlist:changed'))
}

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([])

  useEffect(() => {
    setItems(readWishlist())
    const handler = () => setItems(readWishlist())
    window.addEventListener('wishlist:changed', handler)
    return () => window.removeEventListener('wishlist:changed', handler)
  }, [])

  const toggle = useCallback((item: WishlistItem) => {
    const current = readWishlist()
    const next = current.some((i) => i.id === item.id)
      ? current.filter((i) => i.id !== item.id)
      : [...current, item]
    writeWishlist(next)
  }, [])

  const remove = useCallback((id: string) => {
    writeWishlist(readWishlist().filter((i) => i.id !== id))
  }, [])

  const isWished = useCallback((id: string) => items.some((i) => i.id === id), [items])

  return { items, count: items.length, isWished, toggle, remove }
}
