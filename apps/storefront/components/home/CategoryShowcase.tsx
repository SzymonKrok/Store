import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { AnimatedSection } from '../ui/AnimatedSection'

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
  const fetched = (await fetchCategories()).filter((c) => c.parentId === null)
  if (fetched.length === 0) return null

  const categories = fetched.slice(0, 4)

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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {categories.map((cat, i) => (
            <AnimatedSection key={cat.id} delay={i * 0.07}>
              <Link href={`/sklep?categoryId=${cat.id}`} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-ink-800 border border-ink-700">
                {cat.imageUrl && (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/10 transition-colors duration-300 group-hover:from-ink/95" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-2xl font-medium text-cream italic">{cat.name}</h3>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/40 text-gold transition-colors group-hover:bg-gold group-hover:text-ink">
                      <ArrowUpRight size={15} strokeWidth={1.5} />
                    </span>
                  </div>
                </div>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
