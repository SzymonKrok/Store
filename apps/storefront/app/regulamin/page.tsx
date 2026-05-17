import type { Metadata } from 'next'
import { fetchStoreSettingsServer } from '@/lib/api/settings'

export const metadata: Metadata = {
  title: 'Regulamin | Store',
  description: 'Regulamin sklepu internetowego Store.',
}

export default async function TermsPage() {
  const settings = await fetchStoreSettingsServer()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-display text-4xl font-medium text-stone-900 mb-10">Regulamin</h1>
      {settings.termsOfService ? (
        <div className="prose prose-stone max-w-none text-sm leading-relaxed whitespace-pre-wrap text-stone-700">
          {settings.termsOfService}
        </div>
      ) : (
        <p className="text-stone-400 text-sm italic">Treść regulaminu zostanie wkrótce opublikowana.</p>
      )}
    </div>
  )
}
