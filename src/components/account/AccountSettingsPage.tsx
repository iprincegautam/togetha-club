'use client'

import { useEffect, useState } from 'react'
import { ROUTES } from '@/constants/routes'
import PortalSecuritySection from '@/components/shared/PortalSecuritySection'

export default function AccountSettingsPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/account/me')
      .then((r) => r.json())
      .then((json) => setEmail(json.profile?.email ?? ''))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="account-muted">Loading…</p>

  return (
    <>
      <PortalSecuritySection
        portal="member"
        currentEmail={email}
        forgotPasswordRoute={ROUTES.accountForgotPassword}
        loginRoute={ROUTES.accountLogin}
      />
    </>
  )
}
