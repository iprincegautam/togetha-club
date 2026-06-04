import PartnerLoginForm from '@/components/partner/PartnerLoginForm'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Partner Login — Togetha.Club', 'Sign in to your influencer dashboard.')
}

export default function PartnerLoginPage() {
  return <PartnerLoginForm />
}
