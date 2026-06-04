import { Suspense } from 'react'
import AccountResetPasswordForm from '@/components/account/AccountResetPasswordForm'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Reset Password — Togetha.Club', 'Set a new password for your member account.')
}

export default function AccountResetPasswordPage() {
  return (
    <Suspense fallback={<p className="account-muted">Loading…</p>}>
      <AccountResetPasswordForm />
    </Suspense>
  )
}
