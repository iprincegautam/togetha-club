import SafetySection from '@/components/home/SafetySection'
import { buildMetadata } from '@/lib/metadata'
import { ROUTES } from '@/constants/routes'

export function generateMetadata() {
  return buildMetadata(
    'Safety · Who Gets In — Togetha.Club',
    "Every person in your batch is hand-verified. Single-gender rooms, female trip leads, captains 24/7, and a full refund if we can't verify you.",
    ROUTES.safety
  )
}

export default function SafetyPage() {
  return <SafetySection />
}
