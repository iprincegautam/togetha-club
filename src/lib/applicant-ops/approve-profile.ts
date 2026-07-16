import type { SupabaseClient } from '@supabase/supabase-js'
import { canAdminApproveProfile } from '@/lib/applicant-kyc'
import { isProfileComplete } from '@/lib/payment-claim'
import { BUSINESS } from '@/config/business'
import { sendApplicantBalanceLink } from '@/lib/applicant-ops/send-balance-link'

const APPLICANT_SELECT =
  'id, email, name, status, kyc_status, quiz_answers, batch_slug, gender, profile_completed_at, balance_due'

export async function approveApplicantProfile(service: SupabaseClient, applicantId: string) {
  const { data: applicant, error: fetchError } = await service
    .from('applicants')
    .select(APPLICANT_SELECT)
    .eq('id', applicantId)
    .maybeSingle()

  if (fetchError) {
    console.error('[approveApplicantProfile]', fetchError)
    return { ok: false as const, error: fetchError.message, status: 500 }
  }

  if (!applicant) {
    return { ok: false as const, error: 'Applicant not found', status: 404 }
  }

  const gate = canAdminApproveProfile(applicant)
  if (!gate.ok) {
    return { ok: false as const, error: gate.reason, status: 400 }
  }

  // Start the 48-hour balance clock only when there is an outstanding balance on a
  // deposit booking. Full-paid bookings need no deadline.
  const hasOutstandingBalance =
    applicant.status === 'deposit_paid' && (applicant.balance_due ?? 0) > 0

  const approvedAt = new Date()
  const update: Record<string, unknown> = { kyc_status: 'approved' }
  if (hasOutstandingBalance) {
    const deadline = new Date(
      approvedAt.getTime() + BUSINESS.balancePaymentWindowHours * 60 * 60 * 1000
    )
    update.profile_approved_at = approvedAt.toISOString()
    update.balance_deadline_at = deadline.toISOString()
    update.balance_reminder_sent_at = null
  } else {
    update.profile_approved_at = approvedAt.toISOString()
  }

  const { data, error } = await service
    .from('applicants')
    .update(update)
    .eq('id', applicantId)
    .select('id, email, kyc_status, status, balance_deadline_at')
    .single()

  if (error) {
    console.error('[approveApplicantProfile update]', error)
    return { ok: false as const, error: error.message, status: 500 }
  }

  // Best-effort: email the member that they're approved and the balance clock started.
  // Never block approval on email delivery.
  let emailSent = false
  if (hasOutstandingBalance) {
    try {
      const emailResult = await sendApplicantBalanceLink(service, applicantId)
      emailSent = emailResult.ok
      if (!emailResult.ok) {
        console.warn('[approveApplicantProfile] approval email not sent:', emailResult.error)
      }
    } catch (err) {
      console.error('[approveApplicantProfile] approval email threw', err)
    }
  }

  return {
    ok: true as const,
    applicant: data,
    profileComplete: isProfileComplete(applicant),
    balanceDeadlineAt: data.balance_deadline_at ?? null,
    approvalEmailSent: emailSent,
  }
}
