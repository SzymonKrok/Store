'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import { Eye, Pencil } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}

export function MarkdownEditor({ value, onChange, rows = 10, placeholder }: Props) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className="flex border-b border-border bg-ink-700">
        <button
          type="button"
          onClick={() => setMode('edit')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'edit'
              ? 'bg-card text-cream border-b-2 border-gold -mb-px'
              : 'text-cream-muted hover:text-cream'
          }`}
        >
          <Pencil size={12} />
          Edytor
        </button>
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'preview'
              ? 'bg-card text-cream border-b-2 border-gold -mb-px'
              : 'text-cream-muted hover:text-cream'
          }`}
        >
          <Eye size={12} />
          Podgląd
        </button>
        <div className="ml-auto px-3 py-1.5 text-[11px] text-cream-muted">
          Markdown: **pogrubienie**, *kursywa*, # nagłówek, - lista
        </div>
      </div>

      {mode === 'edit' ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="border-0 rounded-none focus-visible:ring-0 font-mono text-sm resize-y"
        />
      ) : (
        <div className="prose prose-invert prose-sm max-w-none p-4 min-h-[180px] bg-card">
          {value.trim() ? (
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-cream-muted italic">Brak treści — wpisz coś w zakładce „Edytor".</p>
          )}
        </div>
      )}
    </div>
  )
}
