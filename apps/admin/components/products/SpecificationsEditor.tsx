'use client'

import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface SpecRow {
  key: string
  value: string
}

interface Props {
  rows: SpecRow[]
  onChange: (rows: SpecRow[]) => void
}

export function SpecificationsEditor({ rows, onChange }: Props) {
  function update(i: number, patch: Partial<SpecRow>) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }

  function remove(i: number) {
    onChange(rows.filter((_, idx) => idx !== i))
  }

  function add() {
    onChange([...rows, { key: '', value: '' }])
  }

  return (
    <div className="space-y-2">
      {rows.length > 0 && (
        <div className="grid grid-cols-[1fr_1.5fr_auto] gap-2 text-xs font-medium text-muted-foreground">
          <span>Parametr</span>
          <span>Wartość</span>
          <span></span>
        </div>
      )}
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_1.5fr_auto] gap-2 items-center">
          <Input
            value={row.key}
            onChange={(e) => update(i, { key: e.target.value })}
            placeholder="np. Rozdzielczość"
            className="text-sm"
          />
          <Input
            value={row.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder="np. 3840×2160"
            className="text-sm"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
            aria-label="Usuń parametr"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="w-full">
        <Plus size={14} className="mr-1" />
        Dodaj parametr
      </Button>
      {rows.length === 0 && (
        <p className="text-xs text-slate-400 text-center pt-1">
          Brak parametrów. Dodaj wartości takie jak rozmiar, materiał, gwarancja.
        </p>
      )}
      <Label className="text-[11px] text-slate-400 pt-1 block">
        Puste wiersze i puste klucze są pomijane przy zapisie.
      </Label>
    </div>
  )
}
