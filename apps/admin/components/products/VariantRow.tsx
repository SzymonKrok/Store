'use client'

import { Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export interface VariantData {
  id?: string
  sku: string
  price: string
  compareAtPrice: string
  stock: string
  attributes: Record<string, string>
  isActive: boolean
}

interface Props {
  variant: VariantData
  index: number
  attributeKeys: string[]
  onChange: (index: number, v: VariantData) => void
  onDelete: (index: number) => void
  canDelete: boolean
}

export function VariantRow({ variant, index, attributeKeys, onChange, onDelete, canDelete }: Props) {
  function update(partial: Partial<VariantData>) {
    onChange(index, { ...variant, ...partial })
  }

  const gridCols = `1fr 1fr 1fr 80px${attributeKeys.map(() => ' 1fr').join('')} auto auto`

  return (
    <div
      className="grid gap-2 items-center py-2 border-b border-ink-700 last:border-0"
      style={{ gridTemplateColumns: gridCols }}
    >
      <Input
        placeholder="SKU"
        value={variant.sku}
        onChange={(e) => update({ sku: e.target.value })}
        className="font-mono text-sm h-8"
      />
      <Input
        type="number"
        placeholder="Cena (zł)"
        value={variant.price}
        onChange={(e) => update({ price: e.target.value })}
        className="text-sm h-8"
        min="0"
        step="0.01"
      />
      <Input
        type="number"
        placeholder="Cena przed (zł)"
        value={variant.compareAtPrice}
        onChange={(e) => update({ compareAtPrice: e.target.value })}
        className="text-sm h-8"
        min="0"
        step="0.01"
      />
      <Input
        type="number"
        placeholder="Stan"
        value={variant.stock}
        onChange={(e) => update({ stock: e.target.value })}
        className="text-sm h-8"
        min="0"
      />

      {attributeKeys.map((key) => (
        <Input
          key={key}
          placeholder={key}
          value={variant.attributes[key] ?? ''}
          onChange={(e) =>
            update({ attributes: { ...variant.attributes, [key]: e.target.value } })
          }
          className="text-sm h-8"
        />
      ))}

      <div className="flex items-center gap-1.5">
        <Switch
          checked={variant.isActive}
          onCheckedChange={(v) => update({ isActive: v })}
          id={`active-${index}`}
        />
        <Label htmlFor={`active-${index}`} className="text-xs text-cream-muted">Aktywny</Label>
      </div>
      <button
        type="button"
        onClick={() => onDelete(index)}
        disabled={!canDelete}
        className="p-1 text-cream-muted hover:text-red-400 disabled:opacity-30 transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
