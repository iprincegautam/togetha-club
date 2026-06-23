import { NextResponse } from 'next/server'
import { activeStageIndex, bookingStageFromStatus, requireMemberApiAccess } from '@/lib/auth/member'
import { hasVerifiedPayment } from '@/lib/applicant-payment'
import { isProfileComplete } from '@/lib/payment-claim'
import { resolveApplicantPackagePricePaise, formatPaiseAsPackageInr } from '@/lib/package-pricing'
import { getBatchDateOptions } from '@/constants/batches'

export async function GET() {
  const auth = await requireMemberApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const a = auth.applicant
  const batch = Array.isArray(a.batches) ? a.batches[0] : a.batches
  const dateIndex = a.date_choice ? Number(a.date_choice) : null
  const slug = a.batch_slug ?? ''
  const dateOptions = getBatchDateOptions(slug)
  const dateLabel =
    dateIndex !== null && !Number.isNaN(dateIndex)
      ? dateOptions[dateIndex]?.label ?? a.date_choice
      : a.date_choice

  const paid = hasVerifiedPayment(a)
  const profileComplete = isProfileComplete(a)
  const packagePricePaise = await resolveApplicantPackagePricePaise(auth.service, a)

  return NextResponse.json({
    profile: {
      id: auth.profile!.id,
      email: auth.profile!.email,
      fullName: auth.profile!.full_name,
      displayName: auth.profile!.display_name ?? null,
      avatarUrl: auth.profile!.avatar_url ?? null,
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
      stageIndex: activeStageIndex(a.status, a.kyc_status, profileComplete),
      kycStatus: a.kyc_status,
      batchSlug: a.batch_slug,
      batchName: batch?.name ?? null,
      dateChoice: dateLabel,
      paymentPlan: a.payment_plan,
      amountPaid: a.amount_paid,
      balanceDue: a.balance_due,
      finalAmount: a.final_amount,
      originalAmount: a.original_amount,
      discountAmount: a.discount_amount,
      createdAt: a.created_at,
    },
    hasVerifiedPayment: paid,
    profileComplete,
    canCompleteQuiz: paid && !profileComplete,
    packagePricePaise,
    packagePriceLabel: formatPaiseAsPackageInr(packagePricePaise),
  })
}
