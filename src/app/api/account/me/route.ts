import { NextResponse } from 'next/server'
import { activeStageIndex, bookingStageFromStatus, requireMemberApiAccess } from '@/lib/auth/member'
import { BATCH_DATE_OPTIONS } from '@/constants/batches'

export async function GET() {
  const auth = await requireMemberApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const a = auth.applicant
  const batch = Array.isArray(a.batches) ? a.batches[0] : a.batches
  const dateIndex = a.date_choice ? Number(a.date_choice) : null
  const slug = a.batch_slug ?? ''
  const dateOptions = BATCH_DATE_OPTIONS[slug] ?? []
  const dateLabel =
    dateIndex !== null && !Number.isNaN(dateIndex)
      ? dateOptions[dateIndex]?.label ?? a.date_choice
      : a.date_choice

  return NextResponse.json({
    profile: {
      id: auth.profile!.id,
      email: auth.profile!.email,
      fullName: auth.profile!.full_name,
      phone: auth.profile!.phone ?? null,
      city: auth.profile!.city ?? null,
      bio: auth.profile!.bio ?? null,
      emergencyContact: auth.profile!.emergency_contact ?? null,
      dietaryNotes: auth.profile!.dietary_notes ?? null,
      instagramHandle: auth.profile!.instagram_handle ?? null,
    },
    booking: {
      id: a.id,
      status: a.status,
      stage: bookingStageFromStatus(a.status),
      stageIndex: activeStageIndex(a.status, a.kyc_status),
      kycStatus: a.kyc_status,
      batchSlug: a.batch_slug,
      batchName: batch?.name ?? null,
      dateChoice: dateLabel,
      paymentPlan: a.payment_plan,
      amountPaid: a.amount_paid,
      balanceDue: a.balance_due,
      finalAmount: a.final_amount,
      createdAt: a.created_at,
    },
  })
}
