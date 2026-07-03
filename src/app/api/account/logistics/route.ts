import { NextResponse } from 'next/server'
import { isApprovedForTrip, requireMemberApiAccess } from '@/lib/auth/member'
import { isProfileComplete } from '@/lib/payment-claim'

export async function GET() {
  const auth = await requireMemberApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const applicant = auth.applicant as {
    status: string
    kyc_status?: string
    balance_due?: number | null
    departure_id: string | null
  }

  const profileComplete = isProfileComplete(auth.applicant)
  const approved = isApprovedForTrip(
    applicant.status,
    applicant.kyc_status,
    profileComplete,
    applicant.balance_due
  )

  if (!approved || !applicant.departure_id) {
    return NextResponse.json({ available: false, logistics: null })
  }

  const { data, error } = await auth.service
    .from('departure_logistics')
    .select(
      'pickup_location, vehicle_number, reporting_time, departure_time, arrival_time, guide_name, guide_phone, guide_email'
    )
    .eq('departure_id', applicant.departure_id)
    .maybeSingle()

  if (error) {
    console.error('[GET account logistics]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ available: Boolean(data), logistics: data ?? null })
}
