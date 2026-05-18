'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { apiClient } from './axios'

export interface DefaultAddress {
  street: string
  city: string
  postalCode: string
}

export interface AuthUser {
  id: string
  email: string
  role: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  defaultAddress?: DefaultAddress | null
}

interface AuthCtx {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | null>(null)

function decodeTokenBase(token: string): { id: string; email: string; role: string } {
  const payload = token.split('.')[1]
  const data = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  return { id: data.sub, email: data.email, role: data.role }
}

async function fetchMe(): Promise<AuthUser | null> {
  try {
    const { data } = await apiClient.get<AuthUser>('/auth/me')
    return data
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('storefront_token')
    if (token) {
      try {
        decodeTokenBase(token) // validate token structure before calling API
        fetchMe().then((profile) => {
          setUser(profile)
          setIsLoading(false)
        })
      } catch {
        localStorage.removeItem('storefront_token')
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }

    const handleLogout = () => setUser(null)
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [])

  const refreshProfile = useCallback(async () => {
    const profile = await fetchMe()
    if (profile) setUser(profile)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post<{ accessToken: string }>('/auth/login', { email, password })
    localStorage.setItem('storefront_token', data.accessToken)

    // Merge session cart then fetch full profile (includes new profile fields)
    const sessionId = localStorage.getItem('cart_session_id')
    if (sessionId) {
      try {
        await apiClient.post('/cart/merge', { sessionId }, {
          headers: { Authorization: `Bearer ${data.accessToken}` },
        })
      } catch { /* non-critical */ }
    }

    const profile = await fetchMe()
    setUser(profile ?? decodeTokenBase(data.accessToken))
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post<{ accessToken: string }>('/auth/register', { email, password })
    localStorage.setItem('storefront_token', data.accessToken)
    const profile = await fetchMe()
    setUser(profile ?? decodeTokenBase(data.accessToken))
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch { /* always clear client state */ }
    localStorage.removeItem('storefront_token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
