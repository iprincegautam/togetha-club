import PartnerPayouts from '@/components/partner/PartnerPayouts'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Payouts — Partner', 'Payout history and TDS tracker.')
}

export default function PartnerPayoutsPage() {
  return <PartnerPayouts />
}
