import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { TDS_194J_THRESHOLD } from '@/lib/partner-portal'

export async function GET() {
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
      status,
      created_at,
      influencers ( name, payout_upi, payout_bank_name, cash_payouts_this_year )
    `
    )
    .eq('status', 'approved')

  type PreviewGroup = {
    name: string
    hasBank: boolean
    gross: number
    cashYear: number
    ids: string[]
  }
  const byInfluencer = new Map<string, PreviewGroup>()

  for (const r of rows ?? []) {
    const inf = Array.isArray(r.influencers) ? r.influencers[0] : r.influencers
    const id = r.influencer_id as string
    const cur: PreviewGroup = byInfluencer.get(id) ?? {
      name: inf?.name ?? '—',
      hasBank: Boolean(inf?.payout_upi || inf?.payout_bank_name),
      gross: 0,
      cashYear: Number(inf?.cash_payouts_this_year ?? 0),
      ids: [] as string[],
    }
    cur.gross += r.commission_amount ?? 0
    cur.ids.push(String(r.id))
    byInfluencer.set(id, cur)
  }

  const preview = Array.from(byInfluencer.entries()).map(([influencerId, v]) => {
    const tds = v.cashYear > TDS_194J_THRESHOLD ? Math.round(v.gross * 0.1) : 0
    return {
      influencerId,
      name: v.name,
      hasBank: v.hasBank,
      bookings: v.ids.length,
      grossPaise: v.gross,
      tdsPaise: tds,
      netPaise: v.gross - tds,
      ready: v.hasBank && v.gross > 0,
    }
  })

  const { data: paid } = await auth.service
    .from('promo_redemptions')
    .select('commission_amount, paid_at, influencer_id, influencers(name)')
    .in('status', ['paid_out', 'paid'])

  const tds194j = await auth.service
    .from('influencers')
    .select('name, cash_payouts_this_year')
    .gt('cash_payouts_this_year', 40000)

  const tds194r = await auth.service
    .from('influencers')
    .select('name, trip_fmv_this_year')
    .gt('trip_fmv_this_year', 15000)

  return NextResponse.json({
    preview,
    totalUnpaidPaise: preview.reduce((s, p) => s + p.grossPaise, 0),
    creatorCount: preview.length,
    history: paid ?? [],
    tds194j: tds194j.data ?? [],
    tds194r: tds194r.data ?? [],
  })
}
