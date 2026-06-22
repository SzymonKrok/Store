'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tag,
  Users,
  Ticket,
  Settings,
  Undo2,
  Star,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/axios'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Zamówienia', icon: ShoppingCart },
  { href: '/returns', label: 'Zwroty', icon: Undo2 },
  { href: '/reviews', label: 'Opinie', icon: Star },
  { href: '/products', label: 'Produkty', icon: Package },
  { href: '/categories', label: 'Kategorie', icon: Tag },
  { href: '/users', label: 'Użytkownicy', icon: Users },
  { href: '/coupons', label: 'Kupony', icon: Ticket },
  { href: '/settings', label: 'Ustawienia', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // ignore
    }
    localStorage.removeItem('admin_token')
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-ink flex flex-col z-10">
      <div className="px-6 py-5 border-b border-ink-700">
        <Image src="/logo-white.svg" alt="Lune Atelier" width={180} height={60} className="h-12 w-auto object-contain" />
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gold/10 text-gold'
                  : 'text-cream-muted hover:text-cream hover:bg-ink-700',
              )}
            >
              <Icon size={17} strokeWidth={1.5} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-ink-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-cream-muted hover:text-cream hover:bg-ink-700 transition-colors"
        >
          <LogOut size={17} strokeWidth={1.5} />
          Wyloguj się
        </button>
      </div>
    </aside>
  )
}
