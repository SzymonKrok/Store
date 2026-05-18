'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, ShoppingBag, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../lib/auth'

export default function KontoPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

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
          <div>
            <p className="font-medium text-stone-900 text-sm">Dane konta</p>
            <p className="text-stone-400 text-xs mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>

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
