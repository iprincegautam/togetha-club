import PartnerMouForm from '@/components/partner/PartnerMouForm'
import { requirePartnerSession } from '@/lib/auth/partner'
import { tryCreateServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Sign Agreement — Togetha.Club Partner', 'Review and sign the partner MOU.')
}

export default async function PartnerMouPage() {
  const ctx = await requirePartnerSession()
  if (!ctx?.influencer) redirect(ROUTES.partnerLogin)

  const service = tryCreateServiceRoleClient()
  let signerName: string | null = null
  if (service && ctx.influencer.mou_signed) {
    const { data } = await service
      .from('mou_signatures')
      .select('full_name_confirmed')
      .eq('influencer_id', ctx.influencer.id)
      .order('signed_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    signerName = data?.full_name_confirmed ?? null
  }

  return (
    <div className="account-page">
      <p className="apply-eyebrow">✦ Partner onboarding ✦</p>
      <h1 className="account-title">Memorandum of understanding</h1>
      <p className="account-sub">Read all clauses, then sign electronically to continue.</p>
      <PartnerMouForm
        influencerName={ctx.influencer.name}
        signed={Boolean(ctx.influencer.mou_signed)}
        signedAt={ctx.influencer.mou_signed_at}
        signerName={signerName}
      />
    </div>
  )
}
