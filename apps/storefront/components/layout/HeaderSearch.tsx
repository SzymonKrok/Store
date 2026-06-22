'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'

export function HeaderSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Seed the input with the URL's current q when opened on the shop page
  useEffect(() => {
    if (open) {
      setValue(searchParams.get('q') ?? '')
      // Focus after the open animation begins
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [open, searchParams])

  // Close on Escape or outside click
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    const params = new URLSearchParams(searchParams.toString())
    if (trimmed) {
      params.set('q', trimmed)
    } else {
      params.delete('q')
    }
    params.delete('page')
    const target = `/sklep${params.toString() ? `?${params.toString()}` : ''}`
    router.push(target)
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative flex items-center">
      <AnimatePresence initial={false}>
        {open ? (
          <motion.form
            key="input"
            onSubmit={submit}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex items-center overflow-hidden bg-ink-800 border border-ink-600 rounded-xl"
          >
            <Search size={16} strokeWidth={1.5} className="text-gold ml-3 shrink-0" />
            <input
              ref={inputRef}
              type="search"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Szukaj produktów…"
              className="flex-1 px-2.5 py-2 text-sm bg-transparent text-cream outline-none placeholder:text-cream-muted/60"
            />
            <button
              type="button"
              aria-label="Zamknij wyszukiwanie"
              onClick={() => setOpen(false)}
              className="p-2 text-cream-muted hover:text-gold transition-colors cursor-pointer"
            >
              <X size={15} strokeWidth={1.5} />
            </button>
          </motion.form>
        ) : (
          <motion.button
            key="icon"
            type="button"
            aria-label="Szukaj"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="p-2.5 text-cream/70 hover:text-gold hover:bg-ink-700 transition-colors rounded-xl cursor-pointer"
          >
            <Search size={19} strokeWidth={1.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
