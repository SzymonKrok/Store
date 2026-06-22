import type { Metadata } from 'next'
import { fetchStoreSettingsServer } from '@/lib/api/settings'

export const metadata: Metadata = {
  title: 'Regulamin | Lune Atelier',
  description: 'Regulamin sklepu internetowego Lune Atelier.',
}

export default async function TermsPage() {
  const settings = await fetchStoreSettingsServer()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-display text-4xl font-medium text-cream mb-10">Regulamin</h1>
      {settings.termsOfService ? (
        <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap text-cream/80">
          {settings.termsOfService}
        </div>
      ) : (
        <p className="text-cream-muted text-sm italic">Treść regulaminu zostanie wkrótce opublikowana.</p>
      )}
    </div>
  )
}
