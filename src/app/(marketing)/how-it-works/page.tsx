import AISection from '@/components/home/AISection'
import ConceptSection from '@/components/home/ConceptSection'
import HomeFaqSection from '@/components/home/HomeFaqSection'
import HowItWorksHero from '@/components/home/HowItWorksHero'
import HowItWorksSection from '@/components/home/HowItWorksSection'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata(
    'How It Works — Togetha.Club',
    'From compatibility quiz to Himalayan batch: screening, AI matching, 6 days in Manali, Kasol, and Sissu.'
  )
}

export default function HowItWorksPage() {
  return (
    <>
      <HowItWorksHero />
      <HowItWorksSection />
      <ConceptSection />
      <AISection />
      <HomeFaqSection />
    </>
  )
}
