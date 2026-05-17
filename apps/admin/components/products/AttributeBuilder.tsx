'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Props {
  value: Record<string, string>
  onChange: (v: Record<string, string>) => void
}

export function AttributeBuilder({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState('')
  const [val, setVal] = useState('')

  function addAttribute() {
    if (!key.trim()) return
    onChange({ ...value, [key.trim()]: val.trim() })
    setKey('')
    setVal('')
    setOpen(false)
  }

  function removeAttribute(k: string) {
    const next = { ...value }
    delete next[k]
    onChange(next)
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {Object.entries(value).map(([k, v]) => (
        <span
          key={k}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-700"
        >
          {k}: {v}
          <button
            type="button"
            onClick={() => removeAttribute(k)}
            className="text-slate-400 hover:text-slate-700"
          >
            <X size={10} />
          </button>
        </span>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-xs">
            <Plus size={12} className="mr-1" />
            Atrybut
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3 space-y-2">
          <Input
            placeholder="Klucz (np. Rozmiar)"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="h-8 text-sm"
          />
          <Input
            placeholder="Wartość (np. L)"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAttribute())}
          />
          <Button type="button" size="sm" className="w-full" onClick={addAttribute}>
            Dodaj
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  )
}
