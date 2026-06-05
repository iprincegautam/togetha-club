import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { notifyInfluencer } from '@/lib/notifications'
import { TDS_194J_THRESHOLD } from '@/lib/partner-portal'

export async function POST() {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { data: rows } = await auth.service
    .from('promo_redemptions')
    .select(
      `
      id,
      influencer_id,
      commission_amount,
      influencers ( name, payout_upi, payout_bank_name, cash_payouts_this_year )
    `
    )
    .eq('status', 'approved')

  type PayoutGroup = {
    gross: number
    ids: string[]
    name: string
    cashYear: number
    hasBank: boolean
  }
  const groups = new Map<string, PayoutGroup>()

  for (const r of rows ?? []) {
    const inf = Array.isArray(r.influencers) ? r.influencers[0] : r.influencers
    if (!inf?.payout_upi && !inf?.payout_bank_name) continue
    const id = r.influencer_id as string
    const g: PayoutGroup = groups.get(id) ?? {
      gross: 0,
      ids: [] as string[],
      name: inf.name,
      cashYear: Number(inf.cash_payouts_this_year ?? 0),
      hasBank: true,
    }
    g.gross += r.commission_amount ?? 0
    g.ids.push(String(r.id))
    groups.set(id, g)
  }

  const month = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  let processed = 0

  for (const [influencerId, g] of groups) {
    const tds = g.cashYear > TDS_194J_THRESHOLD ? Math.round(g.gross * 0.1) : 0
    const net = g.gross - tds

    await auth.service
      .from('promo_redemptions')
      .update({ status: 'paid_out', paid_at: new Date().toISOString() })
      .in('id', g.ids)

    await auth.service
      .from('influencers')
      .update({ cash_payouts_this_year: g.cashYear + net / 100 })
      .eq('id', influencerId)

    await notifyInfluencer(auth.service, {
      influencerId,
      type: 'payout',
      title: 'Payout processed',
      body: `₹${(net / 100).toLocaleString('en-IN')} paid for ${month}. TDS: ₹${(tds / 100).toLocaleString('en-IN')}.`,
    })
    processed++
  }

  return NextResponse.json({ success: true, processed })
}
