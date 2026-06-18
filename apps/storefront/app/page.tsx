import { HeroSection } from '@/components/home/HeroSection'
import { ValuePropositions } from '@/components/home/ValuePropositions'
import { CraftSection } from '@/components/home/CraftSection'
import { BestsellersSection } from '@/components/home/BestsellersSection'
import { fetchStoreSettingsServer } from '@/lib/api/settings'

export default async function HomePage() {
  const settings = await fetchStoreSettingsServer()

  return (
    <>
      <HeroSection />
      <ValuePropositions />
      <CraftSection />
      {settings.showBestsellers && <BestsellersSection />}
    </>
  )
}
