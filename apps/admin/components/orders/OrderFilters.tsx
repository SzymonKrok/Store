'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, Package, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { ORDER_STATUSES, STATUS_LABELS } from './order-utils'
import type { OrderFilters } from '@/lib/api/orders'

interface Props {
  values: OrderFilters & { page?: number }
  onChange: (key: keyof OrderFilters, value: string) => void
  onClear: () => void
}

const DEBOUNCE_MS = 400

export function OrderFiltersBar({ values, onChange, onClear }: Props) {
  const [searchInput, setSearchInput] = useState(values.search ?? '')
  const [productInput, setProductInput] = useState(values.productName ?? '')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const productTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync local inputs when URL params are cleared externally (e.g. "Wyczyść filtry")
  useEffect(() => { setSearchInput(values.search ?? '') }, [values.search])
  useEffect(() => { setProductInput(values.productName ?? '') }, [values.productName])

  function handleSearchChange(val: string) {
    setSearchInput(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => onChange('search', val), DEBOUNCE_MS)
  }

  function handleProductChange(val: string) {
    setProductInput(val)
    if (productTimer.current) clearTimeout(productTimer.current)
    productTimer.current = setTimeout(() => onChange('productName', val), DEBOUNCE_MS)
  }

  const selectedStatuses = values.status ? values.status.split(',').filter(Boolean) : []

  function toggleStatus(s: string) {
    const next = selectedStatuses.includes(s)
      ? selectedStatuses.filter((x) => x !== s)
      : [...selectedStatuses, s]
    onChange('status', next.join(','))
  }

  const hasFilters = !!(
    values.search ||
    values.status ||
    values.dateFrom ||
    values.dateTo ||
    values.productName
  )

  return (
    <div className="flex flex-wrap gap-2 items-center">

      {/* Customer / ID search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" strokeWidth={1.5} />
        <Input
          placeholder="ID, e-mail, imię…"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-8 border-stone-200 bg-white text-sm h-9 rounded-lg focus-visible:ring-stone-900/20"
        />
        {searchInput && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Product name search */}
      <div className="relative min-w-[160px] max-w-[220px]">
        <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" strokeWidth={1.5} />
        <Input
          placeholder="Produkt…"
          value={productInput}
          onChange={(e) => handleProductChange(e.target.value)}
          className="pl-8 border-stone-200 bg-white text-sm h-9 rounded-lg focus-visible:ring-stone-900/20"
        />
        {productInput && (
          <button
            onClick={() => handleProductChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Status multi-select */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`h-9 gap-1.5 border-stone-200 text-sm font-normal ${selectedStatuses.length > 0 ? 'border-stone-900 bg-stone-50' : 'bg-white'}`}
          >
            Status
            {selectedStatuses.length > 0 && (
              <Badge className="bg-stone-900 text-white text-[10px] px-1.5 py-0 h-4 rounded-full">
                {selectedStatuses.length}
              </Badge>
            )}
            <ChevronDown size={13} className="text-stone-400 ml-0.5" strokeWidth={1.5} />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-52 p-1.5 border-stone-200">
          {ORDER_STATUSES.map((s) => {
            const checked = selectedStatuses.includes(s)
            return (
              <label
                key={s}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-stone-50 cursor-pointer select-none"
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    checked ? 'bg-stone-900 border-stone-900' : 'border-stone-300 bg-white'
                  }`}
                >
                  {checked && (
                    <svg viewBox="0 0 10 8" className="w-2.5 h-2 fill-white">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleStatus(s)}
                  className="sr-only"
                />
                <span className="text-sm text-stone-700">{STATUS_LABELS[s]}</span>
              </label>
            )
          })}
        </PopoverContent>
      </Popover>

      {/* Date from */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-stone-400 shrink-0">Od</span>
        <input
          type="date"
          value={values.dateFrom ?? ''}
          onChange={(e) => onChange('dateFrom', e.target.value)}
          className="h-9 px-2.5 text-sm border border-stone-200 rounded-lg bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900/20 min-w-0 w-[136px]"
        />
      </div>

      {/* Date to */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-stone-400 shrink-0">Do</span>
        <input
          type="date"
          value={values.dateTo ?? ''}
          onChange={(e) => onChange('dateTo', e.target.value)}
          min={values.dateFrom}
          className="h-9 px-2.5 text-sm border border-stone-200 rounded-lg bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900/20 min-w-0 w-[136px]"
        />
      </div>

      {/* Clear */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-9 text-stone-500 hover:text-stone-800 gap-1.5 text-sm"
        >
          <X size={13} strokeWidth={1.5} />
          Wyczyść filtry
        </Button>
      )}
    </div>
  )
}
