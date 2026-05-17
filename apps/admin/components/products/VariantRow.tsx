'use client'

import { Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { AttributeBuilder } from './AttributeBuilder'

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
  onChange: (index: number, v: VariantData) => void
  onDelete: (index: number) => void
  canDelete: boolean
}

export function VariantRow({ variant, index, onChange, onDelete, canDelete }: Props) {
  function update(partial: Partial<VariantData>) {
    onChange(index, { ...variant, ...partial })
  }

  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_80px_1fr_auto_auto] gap-2 items-start py-2 border-b border-slate-100 last:border-0">
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
      <AttributeBuilder
        value={variant.attributes}
        onChange={(attrs) => update({ attributes: attrs })}
      />
      <div className="flex items-center gap-1.5 pt-1">
        <Switch
          checked={variant.isActive}
          onCheckedChange={(v) => update({ isActive: v })}
          id={`active-${index}`}
        />
        <Label htmlFor={`active-${index}`} className="text-xs text-slate-500">Aktywny</Label>
      </div>
      <button
        type="button"
        onClick={() => onDelete(index)}
        disabled={!canDelete}
        className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
