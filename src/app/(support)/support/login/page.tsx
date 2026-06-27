import { Suspense } from 'react'
import SupportLoginForm from '@/components/support/SupportLoginForm'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Support Login — Togetha.Club', 'Sign in to the support portal.')
}

export default function SupportLoginPage() {
  return (
    <Suspense fallback={<p className="account-muted">Loading…</p>}>
      <SupportLoginForm />
    </Suspense>
  )
}
