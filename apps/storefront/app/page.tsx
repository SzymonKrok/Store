import { HeroSection } from '@/components/home/HeroSection'
import { ValuePropositions } from '@/components/home/ValuePropositions'
import { CraftSection } from '@/components/home/CraftSection'
import { BestsellersSection } from '@/components/home/BestsellersSection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ValuePropositions />
      <CraftSection />
      <BestsellersSection />
    </>
  )
}
