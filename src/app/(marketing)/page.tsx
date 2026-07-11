import HeroSection from '@/components/home/HeroSection'
import SafetyStrip from '@/components/home/SafetyStrip'
import BatchPreviewSection from '@/components/home/BatchPreviewSection'
import HomeVideoTestimonialsSection from '@/components/home/HomeVideoTestimonialsSection'
import HomeClosingCta from '@/components/home/HomeClosingCta'
import { fetchBatchDepartureShortLists } from '@/lib/batches'
import { fetchDestinationCatalog } from '@/lib/destination-catalog'
import { tryCreateServerSupabaseClient } from '@/lib/supabase/server'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata(
    "Togetha.Club — India's First Matchmaking Travel Club",
    'AI-matched singles. Himalayan or Udaipur love trails. Take the quiz, pick your batch, go.'
  )
}

export default async function HomePage() {
  const supabase = await tryCreateServerSupabaseClient()
  const [destinations, departureShortLists] = await Promise.all([
    fetchDestinationCatalog(),
    fetchBatchDepartureShortLists(supabase),
  ])

  return (
    <>
      <HeroSection />
      <SafetyStrip />
      <BatchPreviewSection destinations={destinations} departureShortLists={departureShortLists} />
      <HomeVideoTestimonialsSection />
      <HomeClosingCta />
    </>
  )
}
