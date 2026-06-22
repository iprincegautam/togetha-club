import CareersLanding from '@/components/careers/CareersLanding'
import { isInternTrackSlug } from '@/content/careers/roles'
import { buildMetadata } from '@/lib/metadata'
import '@/components/careers/careers.css'

type PageProps = {
  searchParams: Promise<{ role?: string }>
}

export function generateMetadata() {
  return buildMetadata(
    'Careers — Join the Team | Togetha.Club',
    "We're building India's first love trip. Four founding roles — Visual Architect, Motion Storyteller, Member Experience Lead, Voice Architect. ₹15,000/month · 3 months → PPO."
  )
}

export default async function CareersPage({ searchParams }: PageProps) {
  const { role } = await searchParams
  const initialOpen = role && isInternTrackSlug(role) ? role : null

  return (
    <div className="careers-page">
      <CareersLanding initialOpen={initialOpen} />
    </div>
  )
}
