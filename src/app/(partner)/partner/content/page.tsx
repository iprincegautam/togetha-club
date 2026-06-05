import PartnerContentCalendar from '@/components/partner/PartnerContentCalendar'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Content — Partner', 'Content calendar and submissions.')
}

export default function PartnerContentPage() {
  return <PartnerContentCalendar />
}
