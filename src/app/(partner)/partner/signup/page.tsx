import { Suspense } from 'react'
import PartnerSignupForm from '@/components/partner/PartnerSignupForm'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Partner Signup — Togetha.Club', 'Create your influencer partner login.')
}

export default function PartnerSignupPage() {
  return (
    <Suspense fallback={<p className="account-muted">Loading…</p>}>
      <PartnerSignupForm />
    </Suspense>
  )
}
