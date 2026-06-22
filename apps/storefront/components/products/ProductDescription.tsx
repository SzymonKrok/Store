'use client'

import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'

interface ProductDescriptionProps {
  description: string | null
  specifications: Record<string, string> | null
}

export function ProductDescription({ description, specifications }: ProductDescriptionProps) {
  const hasDescription = !!description?.trim()
  const specEntries = specifications ? Object.entries(specifications).filter(([, v]) => v?.trim()) : []
  const hasSpecs = specEntries.length > 0

  if (!hasDescription && !hasSpecs) return null

  return (
    <section className="mt-16 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-start">
      {hasDescription ? (
        <div>
          <h2 className="font-display text-2xl font-medium italic text-cream mb-5">Opis</h2>
          <div className="prose prose-invert max-w-none text-cream/80 prose-headings:font-display prose-headings:italic prose-headings:text-cream prose-strong:text-cream prose-a:text-gold prose-a:no-underline hover:prose-a:underline">
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
              {description!}
            </ReactMarkdown>
          </div>
        </div>
      ) : (
        <div />
      )}

      {hasSpecs && (
        <aside className="bg-ink-800 border border-ink-600 rounded-2xl p-6 lg:sticky lg:top-24">
          <h3 className="font-medium text-cream mb-4">Specyfikacja</h3>
          <dl className="divide-y divide-ink-600">
            {specEntries.map(([key, value]) => (
              <div key={key} className="py-2.5 grid grid-cols-[140px_1fr] gap-3 text-sm">
                <dt className="text-cream-muted">{key}</dt>
                <dd className="text-cream font-medium break-words">{value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      )}
    </section>
  )
}
