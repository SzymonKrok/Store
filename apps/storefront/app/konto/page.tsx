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
        <h1 className="font-display text-3xl font-medium text-stone-900 italic mb-1">Moje konto</h1>
        <p className="text-stone-500 text-sm">{user?.email}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/konto/zamowienia"
          className="flex items-center gap-4 bg-white border border-stone-200 rounded-2xl p-5 hover:border-stone-400 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center group-hover:bg-stone-900 transition-colors">
            <ShoppingBag size={18} strokeWidth={1.5} className="text-stone-600 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="font-medium text-stone-900 text-sm">Moje zamówienia</p>
            <p className="text-stone-400 text-xs mt-0.5">Historia i szczegóły zamówień</p>
          </div>
        </Link>

        <div className="flex items-center gap-4 bg-white border border-stone-200 rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
            <User size={18} strokeWidth={1.5} className="text-stone-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-stone-900 text-sm">
              {user?.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : 'Dane konta'}
            </p>
            <p className="text-stone-400 text-xs mt-0.5 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {hasProfile && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
          <h2 className="font-medium text-stone-900 text-sm">Domyślne dane dostawy</h2>
          <p className="text-xs text-stone-400">Automatycznie wypełniane przy kolejnych zamówieniach.</p>

          <div className="space-y-3">
            {user?.firstName && (
              <div className="flex items-start gap-3">
                <User size={14} strokeWidth={1.5} className="text-stone-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-stone-900">{user.firstName} {user.lastName}</p>
                </div>
              </div>
            )}
            {user?.phone && (
              <div className="flex items-start gap-3">
                <Phone size={14} strokeWidth={1.5} className="text-stone-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-stone-900">{user.phone}</p>
              </div>
            )}
            {user?.defaultAddress && (
              <div className="flex items-start gap-3">
                <MapPin size={14} strokeWidth={1.5} className="text-stone-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-stone-900">
                  <p>{user.defaultAddress.street}</p>
                  <p>{user.defaultAddress.postalCode} {user.defaultAddress.city}</p>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-stone-400 pt-1">
            Dane aktualizują się automatycznie przy każdym zamówieniu z nowym adresem.
          </p>
        </div>
      )}

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-sm text-stone-500 hover:text-red-600 transition-colors cursor-pointer"
      >
        <LogOut size={15} strokeWidth={1.5} />
        Wyloguj się
      </button>
    </div>
  )
}
