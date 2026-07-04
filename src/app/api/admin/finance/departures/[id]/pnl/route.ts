import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'

type RouteParams = { params: Promise<{ id: string }> }

/** Cash basis: only commissions actually paid out count as money out. */
const CASH_OUT_REDEMPTION_STATUSES = ['paid_out', 'paid']

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { id } = await params
  const s = auth.service

  const { data: departure } = await s
    .from('batch_departures')
    .select('id, batch_slug, label, departure_date, status')
    .eq('id', id)
    .maybeSingle()
  if (!departure) {
    return NextResponse.json({ error: 'Departure not found' }, { status: 404 })
  }

  // Confirmed bookings on this departure; final_amount is the trip price
  // after discounts, saved at checkout.
  const { data: applicants } = await s
    .from('applicants')
    .select('id, final_amount, razorpay_payment_id, status')
    .eq('departure_id', id)
  const bookings = (applicants ?? []).filter(
    (a) => a.razorpay_payment_id != null || a.status === 'paid' || a.status === 'deposit_paid'
  )
  const applicantIds = bookings.map((a) => a.id as string)

  const [paymentsRes, redemptionsRes, costsRes] = await Promise.all([
    applicantIds.length
      ? s.from('applicant_payments').select('amount_paise').in('applicant_id', applicantIds)
      : Promise.resolve({ data: [], error: null }),
    applicantIds.length
      ? s
          .from('promo_redemptions')
          .select('commission_amount')
          .in('applicant_id', applicantIds)
          .in('status', CASH_OUT_REDEMPTION_STATUSES)
      : Promise.resolve({ data: [], error: null }),
    s
      .from('departure_costs')
      .select('*')
      .eq('departure_id', id)
      .order('created_at', { ascending: true }),
  ])

  const firstError = paymentsRes.error ?? redemptionsRes.error ?? costsRes.error
  if (firstError) {
    console.error('[GET departure pnl]', firstError)
    return NextResponse.json({ error: firstError.message }, { status: 500 })
  }

  const bookedPaise = bookings.reduce(
    (sum, a) => sum + ((a.final_amount as number) ?? 0),
    0
  )
  const collectedPaise = (paymentsRes.data ?? []).reduce(
    (sum, r) => sum + ((r.amount_paise as number) ?? 0),
    0
  )
  const commissionsPaise = (redemptionsRes.data ?? []).reduce(
    (sum, r) => sum + ((r.commission_amount as number) ?? 0),
    0
  )
  const operatingCostsPaise = (costsRes.data ?? []).reduce(
    (sum, r) => sum + ((r.amount_paise as number) ?? 0),
    0
  )

  return NextResponse.json({
    departure,
    bookingCount: bookings.length,
    bookedPaise,
    collectedPaise,
    outstandingPaise: bookedPaise - collectedPaise,
    commissionsPaise,
    operatingCostsPaise,
    grossProfitPaise: bookedPaise - commissionsPaise - operatingCostsPaise,
    costs: costsRes.data ?? [],
  })
}
