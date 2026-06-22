import { HeroSection } from '@/components/home/HeroSection'
import { CategoryShowcase } from '@/components/home/CategoryShowcase'
import { ProductRail } from '@/components/home/ProductRail'
import { PromoBanner } from '@/components/home/PromoBanner'
import { CraftSection } from '@/components/home/CraftSection'
import { NewsletterSection } from '@/components/home/NewsletterSection'
import { InstagramGallery } from '@/components/home/InstagramGallery'
import { ValuePropositions } from '@/components/home/ValuePropositions'
import { fetchStoreSettingsServer } from '@/lib/api/settings'

export default async function HomePage() {
  const settings = await fetchStoreSettingsServer()

  return (
    <>
      <HeroSection />
      <CategoryShowcase />
      <ProductRail
        eyebrow="Nowości"
        title="Nowa kolekcja"
        query="limit=8&sortBy=newest"
        viewAllHref="/sklep?sortBy=newest"
        className="bg-ink-950"
      />
      <PromoBanner />
      <CraftSection />
      {settings.showBestsellers && (
        <ProductRail
          eyebrow="Polecane"
          title="Bestsellery"
          query="limit=8&sortBy=bestseller"
          viewAllHref="/sklep?sortBy=bestseller"
          className="bg-ink"
        />
      )}
      <NewsletterSection />
      <InstagramGallery />
      <ValuePropositions />
    </>
  )
}
