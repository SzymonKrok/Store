import { AnimatedSection } from '../ui/AnimatedSection'
import { CategoryCarousel } from './CategoryCarousel'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

interface Category {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  parentId: string | null
}

async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    return res.json() as Promise<Category[]>
  } catch {
    return []
  }
}

export async function CategoryShowcase() {
  const categories = (await fetchCategories()).filter((c) => c.parentId === null)
  if (categories.length === 0) return null

  return (
    <section className="py-24 bg-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold mb-3">
            Kolekcje
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-medium text-cream">
            Zakupy według <span className="italic text-gold-200">kategorii</span>
          </h2>
        </AnimatedSection>

        <CategoryCarousel categories={categories} />
      </div>
    </section>
  )
}
