import { Suspense } from 'react'
import PartnerLoginForm from '@/components/partner/PartnerLoginForm'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Partner Login — Togetha.Club', 'Sign in to your influencer dashboard.')
}

export default function PartnerLoginPage() {
  return (
    <Suspense fallback={<p className="account-muted">Loading…</p>}>
      <PartnerLoginForm />
    </Suspense>
  )
}
