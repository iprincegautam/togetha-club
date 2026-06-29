import { NextResponse } from 'next/server'
import { bookingPipelineState, bookingStageFromStatus, requireMemberApiAccess } from '@/lib/auth/member'
import { hasVerifiedPayment } from '@/lib/applicant-payment'
import { isProfileComplete } from '@/lib/payment-claim'
import { resolveApplicantDeparture, parseBatchDepartureRelation } from '@/lib/applicant-departure'
import { resolveApplicantPackagePricePaise, formatPaiseAsPackageInr } from '@/lib/package-pricing'
import { bookingPackageLabelFromApplicant } from '@/lib/applicant-booking-amounts'
import { canMemberPayBalance, isProfileKycApproved } from '@/lib/applicant-kyc'

export async function GET() {
  const auth = await requireMemberApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const a = auth.applicant
  const batch = Array.isArray(a.batches) ? a.batches[0] : a.batches
  const departureJoin = Array.isArray(a.batch_departures)
    ? a.batch_departures[0]
    : a.batch_departures
  const { label: dateLabel } = resolveApplicantDeparture({
    dateChoice: a.date_choice,
    batchSlug: a.batch_slug,
    departureLabel: parseBatchDepartureRelation(departureJoin),
    quizAnswers: a.quiz_answers,
    bookedAt: a.profile_completed_at ?? a.created_at,
  })

  const paid = hasVerifiedPayment(a)
  const profileComplete = isProfileComplete(a)
  const packagePricePaise = await resolveApplicantPackagePricePaise(auth.service, a)
  const storedLabel = bookingPackageLabelFromApplicant(a)
  const pipeline = bookingPipelineState(
    a.status,
    a.kyc_status,
    profileComplete,
    a.balance_due
  )

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
      stageIndex: pipeline.currentIndex,
      completedThrough: pipeline.completedThrough,
      stepStates: pipeline.stepStates,
      pipelineCurrentIndex: pipeline.currentIndex,
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
    profileKycApproved: isProfileKycApproved(a.kyc_status),
    canPayBalance: canMemberPayBalance(a),
    canCompleteQuiz: paid && !profileComplete,
    packagePricePaise,
    packagePriceLabel: storedLabel ?? formatPaiseAsPackageInr(packagePricePaise),
  })
}
