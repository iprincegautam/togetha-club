import PartnerSettingsPage from '@/components/partner/PartnerSettingsPage'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Partner Settings — Togetha.Club', 'Email, password, and sign out.')
}

export default function PartnerSettingsRoute() {
  return <PartnerSettingsPage />
}
