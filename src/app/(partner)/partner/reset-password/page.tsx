import { Suspense } from 'react'
import PartnerResetPasswordForm from '@/components/partner/PartnerResetPasswordForm'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Partner Reset Password — Togetha.Club', 'Set a new partner portal password.')
}

export default function PartnerResetPasswordPage() {
  return (
    <Suspense fallback={<p className="account-muted">Loading…</p>}>
      <PartnerResetPasswordForm />
    </Suspense>
  )
}
