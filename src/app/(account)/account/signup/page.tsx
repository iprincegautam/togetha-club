import { Suspense } from 'react'
import AccountSignupForm from '@/components/account/AccountSignupForm'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Create Member Account — Togetha.Club', 'Sign up to track your booking.')
}

export default function AccountSignupPage() {
  return (
    <Suspense fallback={<p className="account-muted">Loading…</p>}>
      <AccountSignupForm />
    </Suspense>
  )
}
