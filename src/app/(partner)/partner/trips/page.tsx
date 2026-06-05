import PartnerTrips from '@/components/partner/PartnerTrips'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('My Trips — Partner', 'Complimentary trip entitlements.')
}

export default function PartnerTripsPage() {
  return <PartnerTrips />
}
