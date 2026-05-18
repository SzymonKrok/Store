'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { apiClient } from './axios'

export interface AuthUser {
  id: string
  email: string
  role: string
}

interface AuthCtx {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | null>(null)

function decodeToken(token: string): AuthUser {
  const payload = token.split('.')[1]
  const data = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  return { id: data.sub, email: data.email, role: data.role }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('storefront_token')
    if (token) {
      try {
        setUser(decodeToken(token))
      } catch {
        localStorage.removeItem('storefront_token')
      }
    }
    setIsLoading(false)

    // Axios interceptor signals session expiry
    const handleLogout = () => setUser(null)
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post<{ accessToken: string }>('/auth/login', { email, password })
    localStorage.setItem('storefront_token', data.accessToken)
    setUser(decodeToken(data.accessToken))

    // Merge anonymous session cart into the user's cart (best-effort)
    const sessionId = localStorage.getItem('cart_session_id')
    if (sessionId) {
      try {
        await apiClient.post('/cart/merge', { sessionId }, {
          headers: { Authorization: `Bearer ${data.accessToken}` },
        })
      } catch { /* silently ignore — cart merge is non-critical */ }
    }
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post<{ accessToken: string }>('/auth/register', { email, password })
    localStorage.setItem('storefront_token', data.accessToken)
    setUser(decodeToken(data.accessToken))
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch { /* ignore — always clear client state */ }
    localStorage.removeItem('storefront_token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
