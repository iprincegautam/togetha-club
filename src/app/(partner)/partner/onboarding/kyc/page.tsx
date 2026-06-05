import PartnerKycForm from '@/components/partner/PartnerKycForm'
import { requirePartnerSession } from '@/lib/auth/partner'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Verify Identity — Togetha.Club Partner', 'Submit PAN for payout verification.')
}

export default async function PartnerKycPage() {
  const ctx = await requirePartnerSession()
  if (!ctx?.influencer) redirect(ROUTES.partnerLogin)
  if (!ctx.influencer.mou_signed) redirect(ROUTES.partnerMou)

  return (
    <div className="account-page">
      <p className="apply-eyebrow">✦ Partner onboarding ✦</p>
      <h1 className="account-title">Verify your identity</h1>
      <p className="account-sub">PAN is required before we can process commission payouts.</p>
      <PartnerKycForm
        panVerified={Boolean(ctx.influencer.pan_verified)}
        panNumber={ctx.influencer.pan_number}
      />
    </div>
  )
}
