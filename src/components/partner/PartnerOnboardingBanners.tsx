'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ROUTES } from '@/constants/routes'
import {
  TDS_194J_THRESHOLD,
  TDS_194J_WARN,
  TDS_194R_THRESHOLD,
  TDS_194R_WARN,
  formatInrAmount,
} from '@/lib/partner-portal'

type Props = {
  mouSigned: boolean
  panVerified: boolean
  panDocUrl: string | null
  cashPayoutsThisYear: number
  tripFmvThisYear: number
}

export default function PartnerOnboardingBanners({
  mouSigned,
  panVerified,
  panDocUrl,
  cashPayoutsThisYear,
  tripFmvThisYear,
}: Props) {
  const [hideSetup, setHideSetup] = useState(false)

  useEffect(() => {
    if (mouSigned && panVerified) {
      const t = setTimeout(() => setHideSetup(true), 3000)
      return () => clearTimeout(t)
    }
  }, [mouSigned, panVerified])

  return (
    <>
      {!mouSigned && (
        <div className="portal-banner portal-banner--amber">
          Your agreement is pending.{' '}
          <Link href={ROUTES.partnerMou}>Sign now →</Link>
        </div>
      )}
      {mouSigned && !panVerified && !panDocUrl && (
        <div className="portal-banner portal-banner--amber">
          Upload your PAN to enable payouts.{' '}
          <Link href={ROUTES.partnerKyc}>Verify identity →</Link>
        </div>
      )}
      {mouSigned && panDocUrl && !panVerified && (
        <div className="portal-banner portal-banner--blue">
          PAN verification in progress. We&apos;ll notify you when it&apos;s done.
        </div>
      )}
      {mouSigned && panVerified && !hideSetup && (
        <div className="portal-banner portal-banner--green">You&apos;re fully set up.</div>
      )}
      {cashPayoutsThisYear > TDS_194J_WARN && cashPayoutsThisYear <= TDS_194J_THRESHOLD && (
        <div className="portal-banner portal-banner--amber">
          Approaching TDS threshold — payouts above {formatInrAmount(TDS_194J_THRESHOLD)} attract 10%
          TDS under Section 194J.
        </div>
      )}
      {cashPayoutsThisYear > TDS_194J_THRESHOLD && (
        <div className="portal-banner portal-banner--coral">
          TDS is being deducted at 10% on your cash payouts.
        </div>
      )}
      {tripFmvThisYear > TDS_194R_WARN && tripFmvThisYear <= TDS_194R_THRESHOLD && (
        <div className="portal-banner portal-banner--amber">
          Complimentary trip value is approaching the {formatInrAmount(TDS_194R_THRESHOLD)} Section 194R
          threshold.
        </div>
      )}
    </>
  )
}
