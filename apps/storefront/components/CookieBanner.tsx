'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { Cookie } from 'lucide-react'

export const CONSENT_KEY = 'cookie_consent'

export type CookieConsent = { analytics: boolean; decidedAt: number }

export function getConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    return raw ? (JSON.parse(raw) as CookieConsent) : null
  } catch {
    return null
  }
}

export function setConsent(analytics: boolean) {
  const consent: CookieConsent = { analytics, decidedAt: Date.now() }
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent))
  window.dispatchEvent(new CustomEvent('cookie_consent_update', { detail: consent }))
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!getConsent()) setVisible(true)
  }, [])

  function accept() {
    setConsent(true)
    setVisible(false)
  }

  function reject() {
    setConsent(false)
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-md"
        >
          <div className="bg-white border border-stone-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.10)] p-5">
            <div className="flex items-start gap-3 mb-4">
              <Cookie size={18} strokeWidth={1.5} className="text-amber-700 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-stone-900 mb-1">Używamy plików cookie</p>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Korzystamy z plików cookie do analizy ruchu i personalizacji reklam.
                  Możesz zaakceptować wszystkie lub odrzucić opcjonalne.{' '}
                  <Link
                    href="/polityka-prywatnosci"
                    className="underline underline-offset-2 hover:text-stone-900 transition-colors"
                  >
                    Dowiedz się więcej
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={accept}
                className="flex-1 bg-amber-800 text-white text-xs font-medium py-2.5 rounded-xl hover:bg-amber-900 transition-colors"
              >
                Akceptuję wszystkie
              </button>
              <button
                onClick={reject}
                className="flex-1 border border-stone-300 text-stone-700 text-xs font-medium py-2.5 rounded-xl hover:bg-stone-50 transition-colors"
              >
                Tylko niezbędne
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
