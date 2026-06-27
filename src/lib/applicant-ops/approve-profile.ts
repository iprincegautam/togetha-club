import type { SupabaseClient } from '@supabase/supabase-js'
import { canAdminApproveProfile } from '@/lib/applicant-kyc'
import { isProfileComplete } from '@/lib/payment-claim'

const APPLICANT_SELECT =
  'id, email, name, status, kyc_status, quiz_answers, batch_slug, gender, profile_completed_at'

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

  const { data, error } = await service
    .from('applicants')
    .update({ kyc_status: 'approved' })
    .eq('id', applicantId)
    .select('id, email, kyc_status, status')
    .single()

  if (error) {
    console.error('[approveApplicantProfile update]', error)
    return { ok: false as const, error: error.message, status: 500 }
  }

  return {
    ok: true as const,
    applicant: data,
    profileComplete: isProfileComplete(applicant),
  }
}
