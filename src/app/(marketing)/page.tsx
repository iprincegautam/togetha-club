import HeroSection from '@/components/home/HeroSection'
import MarqueeStrip from '@/components/home/MarqueeStrip'
import ConceptSection from '@/components/home/ConceptSection'
import AISection from '@/components/home/AISection'
import HowItWorksSection from '@/components/home/HowItWorksSection'
import BatchPreviewSection from '@/components/home/BatchPreviewSection'
import ReviewsSection from '@/components/home/ReviewsSection'
import HomeFaqSection from '@/components/home/HomeFaqSection'
import { tryCreateServerSupabaseClient } from '@/lib/supabase/server'
import { buildMetadata } from '@/lib/metadata'
import type { Batch, BatchStatus } from '@/types/batch'
export function generateMetadata() {
  return buildMetadata(
    "Togetha.Club — India's First Matchmaking Travel Club",
    'AI-matched singles. 6 days in the Himalayas. Like Hinge, but for travelers.'
  )
}

type BatchPreview = Pick<
  Batch,
  'slug' | 'name' | 'price' | 'spotsTakenM' | 'spotsTakenF' | 'status'
>

const FALLBACK_BATCHES: BatchPreview[] = [
  {
    slug: 'batch-a',
    name: 'The Himalayan Love Trail A',
    price: 18999,
    spotsTakenM: 6,
    spotsTakenF: 7,
    status: 'open',
  },
  {
    slug: 'batch-b',
    name: 'The Himalayan Love Trail B',
    price: 22999,
    spotsTakenM: 5,
    spotsTakenF: 6,
    status: 'open',
  },
]

async function fetchBatches(): Promise<BatchPreview[]> {
  try {
    const supabase = tryCreateServerSupabaseClient()
    if (!supabase) return FALLBACK_BATCHES

    const { data, error } = await supabase
      .from('batches')
      .select('slug, name, price, spots_taken_m, spots_taken_f, status')
      .in('slug', ['batch-a', 'batch-b'])

    if (error || !data?.length) {
      return FALLBACK_BATCHES
    }

    return data.map((row) => ({
      slug: row.slug,
      name: row.name,
      price: row.price,
      spotsTakenM: row.spots_taken_m ?? 0,
      spotsTakenF: row.spots_taken_f ?? 0,
      status: row.status as BatchStatus,
    }))
  } catch {
    return FALLBACK_BATCHES
  }
}

export default async function HomePage() {
  const batches = await fetchBatches()

  return (
    <>
      <HeroSection />
      <MarqueeStrip />
      <ConceptSection />
      <AISection />
      <HowItWorksSection />
      <BatchPreviewSection batches={batches} />
      <ReviewsSection />
      <HomeFaqSection />
    </>
  )
}
