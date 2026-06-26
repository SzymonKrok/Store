'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart } from 'lucide-react'
import { useWishlist } from '@/lib/wishlist'

interface WishlistDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function WishlistDrawer({ isOpen, onClose }: WishlistDrawerProps) {
  const { items, remove } = useWishlist()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Ulubione"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed top-0 right-0 bottom-0 z-[95] w-full max-w-sm bg-ink-850 border-l border-ink-600 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-5 border-b border-ink-600 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <Heart size={17} strokeWidth={1.5} className="text-gold" />
                <span className="font-medium text-cream text-sm tracking-wide">
                  Ulubione{items.length > 0 ? ` (${items.length})` : ''}
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Zamknij ulubione"
                className="p-2 text-cream-muted hover:text-gold hover:bg-ink-700 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Body */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8">
                <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <Heart size={28} strokeWidth={1} className="text-gold" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-cream mb-1.5">Brak ulubionych produktów</p>
                  <p className="text-cream-muted text-sm leading-relaxed">
                    Kliknij serduszko na produkcie, aby go zapisać
                  </p>
                </div>
                <Link
                  href="/sklep"
                  onClick={onClose}
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-gold text-ink text-sm font-semibold rounded-xl hover:bg-gold-200 transition-colors cursor-pointer"
                >
                  Przeglądaj sklep
                </Link>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3.5">
                    <Link
                      href={`/sklep/${item.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-3.5 flex-1 min-w-0 group"
                    >
                      <div className="w-[60px] h-[80px] flex-shrink-0 rounded-xl overflow-hidden bg-ink-700">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            width={60}
                            height={80}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Heart size={20} strokeWidth={1} className="text-ink-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-cream line-clamp-2 group-hover:text-gold transition-colors">
                          {item.name}
                        </p>
                        <p className="text-sm text-gold tabular-nums mt-1">{item.price} zł</p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label={`Usuń ${item.name} z ulubionych`}
                      className="flex-shrink-0 p-1.5 text-cream-muted hover:text-gold hover:bg-ink-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <X size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
