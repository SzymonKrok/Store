import { HeroSection } from '@/components/home/HeroSection'
import { ValuePropositions } from '@/components/home/ValuePropositions'
import { BestsellersSection } from '@/components/home/BestsellersSection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ValuePropositions />
      <BestsellersSection />
    </>
  )
}
