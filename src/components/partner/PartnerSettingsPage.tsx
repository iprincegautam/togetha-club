'use client'

import { useEffect, useState } from 'react'
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
      <PortalSecuritySection
        portal="partner"
        currentEmail={email}
        forgotPasswordRoute={ROUTES.partnerForgotPassword}
        loginRoute={ROUTES.partnerLogin}
      />
    </>
  )
}
