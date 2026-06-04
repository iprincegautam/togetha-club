import { Suspense } from 'react'
import AccountLoginForm from '@/components/account/AccountLoginForm'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Member Login — Togetha.Club', 'Sign in to track your booking.')
}

export default function AccountLoginPage() {
  return (
    <Suspense fallback={<p className="account-muted">Loading…</p>}>
      <AccountLoginForm />
    </Suspense>
  )
}
