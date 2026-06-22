'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, ShoppingBag, LogOut, MapPin, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../lib/auth'

export default function KontoPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const hasProfile = user?.firstName || user?.phone || user?.defaultAddress

  async function handleLogout() {
    await logout()
    toast.success('Wylogowano pomyślnie')
    router.push('/')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium text-cream italic mb-1">Moje konto</h1>
        <p className="text-cream-muted text-sm">{user?.email}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/konto/zamowienia"
          className="flex items-center gap-4 bg-ink-800 border border-ink-600 rounded-2xl p-5 hover:border-gold/40 hover:shadow-[0_4px_20px_rgba(200,164,92,0.1)] transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-ink-700 flex items-center justify-center group-hover:bg-gold transition-colors">
            <ShoppingBag size={18} strokeWidth={1.5} className="text-gold group-hover:text-ink transition-colors" />
          </div>
          <div>
            <p className="font-medium text-cream text-sm">Moje zamówienia</p>
            <p className="text-cream-muted text-xs mt-0.5">Historia i szczegóły zamówień</p>
          </div>
        </Link>

        <div className="flex items-center gap-4 bg-ink-800 border border-ink-600 rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-ink-700 flex items-center justify-center">
            <User size={18} strokeWidth={1.5} className="text-gold" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-cream text-sm">
              {user?.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : 'Dane konta'}
            </p>
            <p className="text-cream-muted text-xs mt-0.5 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {hasProfile && (
        <div className="bg-ink-800 border border-ink-600 rounded-2xl p-6 space-y-4">
          <h2 className="font-medium text-cream text-sm">Domyślne dane dostawy</h2>
          <p className="text-xs text-cream-muted">Automatycznie wypełniane przy kolejnych zamówieniach.</p>

          <div className="space-y-3">
            {user?.firstName && (
              <div className="flex items-start gap-3">
                <User size={14} strokeWidth={1.5} className="text-gold mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-cream">{user.firstName} {user.lastName}</p>
                </div>
              </div>
            )}
            {user?.phone && (
              <div className="flex items-start gap-3">
                <Phone size={14} strokeWidth={1.5} className="text-gold mt-0.5 flex-shrink-0" />
                <p className="text-sm text-cream">{user.phone}</p>
              </div>
            )}
            {user?.defaultAddress && (
              <div className="flex items-start gap-3">
                <MapPin size={14} strokeWidth={1.5} className="text-gold mt-0.5 flex-shrink-0" />
                <div className="text-sm text-cream">
                  <p>{user.defaultAddress.street}</p>
                  <p>{user.defaultAddress.postalCode} {user.defaultAddress.city}</p>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-cream-muted pt-1">
            Dane aktualizują się automatycznie przy każdym zamówieniu z nowym adresem.
          </p>
        </div>
      )}

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-sm text-cream-muted hover:text-red-400 transition-colors cursor-pointer"
      >
        <LogOut size={15} strokeWidth={1.5} />
        Wyloguj się
      </button>
    </div>
  )
}
