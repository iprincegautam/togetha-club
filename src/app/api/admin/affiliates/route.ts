import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'

function firstRelation<T>(rel: T | T[] | null): T | null {
  if (!rel) return null
  if (Array.isArray(rel)) return rel[0] ?? null
  return rel
}

export async function GET() {
  try {
    const auth = await requireAdminApiAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { data: influencers, error: infError } = await auth.service
      .from('influencers')
      .select('id, name, email, status')
      .order('name')

    if (infError) throw infError

    const { data: promoCodes, error: promoError } = await auth.service
      .from('promo_codes')
      .select(
        `
        id,
        code,
        discount_type,
        discount_value,
        commission_amount,
        grants_priority,
        max_uses,
        uses_count,
        active,
        influencers ( name, email )
      `
      )
      .order('code')

    if (promoError) throw promoError

    const { data: redemptions, error: redError } = await auth.service
      .from('promo_redemptions')
      .select(
        `
        id,
        influencer_id,
        discount_amount,
        commission_amount,
        paid_at,
        applicants ( name, email, batch_slug ),
        promo_codes ( code ),
        influencers ( name )
      `
      )
      .order('paid_at', { ascending: false })
      .limit(50)

    if (redError) throw redError

    const commissionByInfluencer = new Map<string, { count: number; total: number }>()
    for (const r of redemptions ?? []) {
      const current = commissionByInfluencer.get(r.influencer_id) ?? { count: 0, total: 0 }
      current.count += 1
      current.total += r.commission_amount ?? 0
      commissionByInfluencer.set(r.influencer_id, current)
    }

    const influencerStats = (influencers ?? []).map((inf) => {
      const stats = commissionByInfluencer.get(inf.id) ?? { count: 0, total: 0 }
      return {
        id: inf.id,
        name: inf.name,
        email: inf.email,
        status: inf.status,
        paidBookings: stats.count,
        totalCommissionPaise: stats.total,
      }
    })

    const formattedPromos = (promoCodes ?? []).map((p) => {
      const influencer = firstRelation(
        p.influencers as { name: string; email: string } | { name: string; email: string }[] | null
      )
      return {
        id: p.id,
        code: p.code,
        influencerName: influencer?.name ?? '—',
        discountType: p.discount_type,
        discountValue: p.discount_value,
        commissionAmount: p.commission_amount,
        grantsPriority: p.grants_priority,
        usesCount: p.uses_count,
        maxUses: p.max_uses,
        active: p.active,
      }
    })

    const formattedRedemptions = (redemptions ?? []).map((r) => {
      const app = firstRelation(
        r.applicants as { name: string; email: string; batch_slug: string } | { name: string; email: string; batch_slug: string }[] | null
      )
      const promo = firstRelation(r.promo_codes as { code: string } | { code: string }[] | null)
      const inf = firstRelation(r.influencers as { name: string } | { name: string }[] | null)
      return {
        id: r.id,
        applicantName: app?.name ?? app?.email ?? '—',
        batchSlug: app?.batch_slug ?? '—',
        promoCode: promo?.code ?? '—',
        influencerName: inf?.name ?? '—',
        discountAmount: r.discount_amount,
        commissionAmount: r.commission_amount,
        paidAt: r.paid_at,
      }
    })

    return NextResponse.json({
      influencerStats,
      promoCodes: formattedPromos,
      redemptions: formattedRedemptions,
    })
  } catch (err) {
    console.error('[GET /api/admin/affiliates]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
