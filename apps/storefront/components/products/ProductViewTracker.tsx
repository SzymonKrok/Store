'use client'

import { useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

export function ProductViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`${API_URL}/products/${encodeURIComponent(slug)}/view`, {
      method: 'POST',
      keepalive: true,
    }).catch(() => {})
  }, [slug])

  return null
}
