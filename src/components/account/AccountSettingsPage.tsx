'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
      <p className="account-foot" style={{ marginBottom: 16 }}>
        <Link href={ROUTES.accountProfile} className="admin-inline-link">
          ← Profile
        </Link>
        {' · '}
        <Link href={ROUTES.accountPayments} className="admin-inline-link">
          Payment methods
        </Link>
      </p>
      <PortalSecuritySection
        portal="member"
        currentEmail={email}
        forgotPasswordRoute={ROUTES.accountForgotPassword}
        loginRoute={ROUTES.accountLogin}
      />
    </>
  )
}
