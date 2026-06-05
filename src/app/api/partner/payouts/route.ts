import { NextResponse } from 'next/server'
import { requirePartnerApiAccess } from '@/lib/auth/partner'
import { calcTdsDeduction, monthKey, TDS_194J_THRESHOLD } from '@/lib/partner-portal'

export async function GET() {
  const auth = await requirePartnerApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { data: rows } = await auth.service
    .from('promo_redemptions')
    .select('commission_amount, status, created_at, paid_at')
    .eq('influencer_id', auth.influencer.id)
    .order('created_at', { ascending: false })

  const list = rows ?? []
  const pending = list.filter((r) => r.status === 'pending' || r.status === 'approved')
  const queuedPaise = pending.reduce((s, r) => s + (r.commission_amount ?? 0), 0)

  const cashYear = Number(auth.influencer.cash_payouts_this_year ?? 0)
  const tdsPaise = calcTdsDeduction(queuedPaise, cashYear)
  const netPaise = queuedPaise - tdsPaise

  const now = new Date()
  const nextPayout = new Date(now.getFullYear(), now.getMonth() + 1, 10)

  const byMonth = new Map<
    string,
    { gross: number; tds: number; net: number; count: number; status: string }
  >()

  for (const r of list) {
    const key = monthKey(r.paid_at ?? r.created_at)
    const cur = byMonth.get(key) ?? { gross: 0, tds: 0, net: 0, count: 0, status: 'Pending' }
    const amt = r.commission_amount ?? 0
    if (r.status === 'cancelled') continue
    cur.count += 1
    cur.gross += amt
    if (r.status === 'paid_out' || r.status === 'paid') {
      cur.status = 'Paid'
    }
    byMonth.set(key, cur)
  }

  const history = Array.from(byMonth.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, v]) => {
      const tds = cashYear > TDS_194J_THRESHOLD ? Math.round(v.gross * 0.1) : 0
      return {
        month,
        bookings: v.count,
        grossPaise: v.gross,
        tdsPaise: tds,
        netPaise: v.gross - tds,
        status: v.status,
      }
    })

  return NextResponse.json({
    nextPayoutDate: nextPayout.toISOString(),
    queuedPaise,
    tdsPaise,
    netPaise,
    cashPayoutsThisYear: cashYear,
    tripFmvThisYear: Number(auth.influencer.trip_fmv_this_year ?? 0),
    payoutUpi: auth.influencer.payout_upi,
    payoutBankName: auth.influencer.payout_bank_name,
    payoutAccountHolder: auth.influencer.payout_account_holder,
    payoutAccountNumber: auth.influencer.payout_account_number,
    history,
  })
}
