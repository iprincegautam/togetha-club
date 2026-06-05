import PartnerBookings from '@/components/partner/PartnerBookings'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Bookings — Partner', 'Track bookings through your affiliate links.')
}

export default function PartnerBookingsPage() {
  return <PartnerBookings />
}
