import { NextResponse } from 'next/server'
import { requireMemberApiAccess } from '@/lib/auth/member'
import { resolveDepartureForPersist } from '@/lib/applicant-departure'

export async function GET() {
  const auth = await requireMemberApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const applicant = auth.applicant as {
    status: string
    amount_paid?: number | null
    departure_id: string | null
    batch_slug?: string | null
    date_choice?: string | null
  }

  // Logistics shares a real guide's phone number with the member, so it requires
  // an explicit admin sign-off (status === 'approved', set from the applicant Review
  // panel) — not just an inferred "looks confirmed" state like My Booking uses.
  const paidAtLeastDeposit = (applicant.amount_paid ?? 0) > 0
  const adminApproved = applicant.status === 'approved'

  if (!adminApproved || !paidAtLeastDeposit) {
    return NextResponse.json({ available: false, logistics: null })
  }

  // Some older/legacy applicants have date_choice set but never got departure_id
  // backfilled onto their row. Resolve it the same way apply/complete-profile do,
  // instead of failing closed on a data gap that isn't the member's fault.
  let departureId = applicant.departure_id
  if (!departureId && applicant.batch_slug && applicant.date_choice) {
    const resolved = await resolveDepartureForPersist(
      auth.service,
      applicant.batch_slug,
      applicant.date_choice
    )
    departureId = resolved.departure_id
  }

  if (!departureId) {
    return NextResponse.json({ available: false, logistics: null })
  }

  const { data, error } = await auth.service
    .from('departure_logistics')
    .select(
      'pickup_location, vehicle_number, reporting_time, departure_time, arrival_time, guide_name, guide_phone, guide_email'
    )
    .eq('departure_id', departureId)
    .maybeSingle()

  if (error) {
    console.error('[GET account logistics]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ available: Boolean(data), logistics: data ?? null })
}
