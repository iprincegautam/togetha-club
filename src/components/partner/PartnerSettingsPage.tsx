'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import PortalSecuritySection from '@/components/shared/PortalSecuritySection'

export default function PartnerSettingsPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/partner/me')
      .then((r) => r.json())
      .then((json) => setEmail(json.influencer?.email ?? ''))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="account-muted">Loading…</p>

  return (
    <>
      <p className="account-foot" style={{ marginBottom: 16 }}>
        <Link href={ROUTES.partnerProfile} className="admin-inline-link">
          ← Profile & payout
        </Link>
      </p>
      <PortalSecuritySection
        portal="partner"
        currentEmail={email}
        forgotPasswordRoute={ROUTES.partnerForgotPassword}
        loginRoute={ROUTES.partnerLogin}
      />
    </>
  )
}
