'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../../lib/auth'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshProfile } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      router.replace('/logowanie')
      return
    }
    localStorage.setItem('storefront_token', token)
    refreshProfile().finally(() => {
      router.replace('/konto')
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <p className="text-cream-muted text-sm">Logowanie…</p>
    </div>
  )
}
