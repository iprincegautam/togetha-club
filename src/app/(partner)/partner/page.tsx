import PartnerDashboard from '@/components/partner/PartnerDashboard'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata(
    'Partner Dashboard — Togetha.Club',
    'Track promo codes, conversions, and commission earnings.'
  )
}

export default function PartnerPage() {
  return <PartnerDashboard />
}
