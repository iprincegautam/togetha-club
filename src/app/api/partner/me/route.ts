import { NextResponse } from 'next/server'
import { requirePartnerApiAccess } from '@/lib/auth/partner'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://togetha.club'

export async function GET() {
  const auth = await requirePartnerApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const influencerId = auth.influencer.id

  const { data: promos } = await auth.service
    .from('promo_codes')
    .select('*')
    .eq('influencer_id', influencerId)
    .order('code')

  const { data: redemptions } = await auth.service
    .from('promo_redemptions')
    .select(
      `
      id,
      discount_amount,
      commission_amount,
      status,
      paid_at,
      created_at,
      applicants ( name, email, batch_slug ),
      promo_codes ( code )
    `
    )
    .eq('influencer_id', influencerId)
    .order('created_at', { ascending: false })

  const rows = redemptions ?? []
  const pending = rows.filter((r) => r.status === 'pending')
  const approved = rows.filter((r) => r.status === 'approved')
  const paidOut = rows.filter((r) => r.status === 'paid_out' || r.status === 'paid')

  const sum = (list: typeof rows) =>
    list.reduce((acc, r) => acc + (r.commission_amount ?? 0), 0)

  return NextResponse.json({
    influencer: {
      id: auth.influencer.id,
      name: auth.influencer.name,
      email: auth.influencer.email,
      status: auth.influencer.status,
      payoutUpi: auth.influencer.payout_upi,
    },
    stats: {
      totalCodes: promos?.length ?? 0,
      totalRedemptions: rows.length,
      pendingCommissionPaise: sum(pending),
      approvedCommissionPaise: sum(approved),
      paidOutCommissionPaise: sum(paidOut),
    },
    promoCodes: (promos ?? []).map((p) => ({
      id: p.id,
      code: p.code,
      discountType: p.discount_type,
      discountValue: p.discount_value,
      commissionAmount: p.commission_amount,
      usesCount: p.uses_count,
      maxUses: p.max_uses,
      active: p.active,
      shareUrl: `${SITE_URL}/apply/batch-a?promo=${encodeURIComponent(p.code)}`,
    })),
    redemptions: rows.map((r) => {
      const app = Array.isArray(r.applicants) ? r.applicants[0] : r.applicants
      const promo = Array.isArray(r.promo_codes) ? r.promo_codes[0] : r.promo_codes
      return {
        id: r.id,
        promoCode: promo?.code ?? '—',
        applicantName: app?.name ?? app?.email ?? '—',
        batchSlug: app?.batch_slug ?? '—',
        commissionAmount: r.commission_amount,
        status: r.status,
        paidAt: r.paid_at,
      }
    }),
  })
}

export async function PATCH(request: Request) {
  const auth = await requirePartnerApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  if (body.payoutUpi === undefined) {
    return NextResponse.json({ error: 'payoutUpi required' }, { status: 400 })
  }

  const { data, error } = await auth.service
    .from('influencers')
    .update({ payout_upi: body.payoutUpi ? String(body.payoutUpi).trim() : null })
    .eq('id', auth.influencer.id)
    .select('payout_upi')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ payoutUpi: data.payout_upi })
}
