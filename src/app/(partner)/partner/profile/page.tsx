import PartnerProfilePage from '@/components/partner/PartnerProfilePage'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Partner Profile — Togetha.Club', 'Update your profile and payout details.')
}

export default function PartnerProfileRoute() {
  return <PartnerProfilePage />
}
