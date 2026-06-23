import { isProfileComplete } from '@/lib/payment-claim'

export type ApplicantKycStatus = 'pending' | 'submitted' | 'approved' | 'rejected'

export function isProfileKycApproved(kycStatus?: string | null): boolean {
  return kycStatus === 'approved'
}

export function isProfileKycRejected(kycStatus?: string | null): boolean {
  return kycStatus === 'rejected'
}

export function canMemberPayBalance(applicant: {
  status?: string | null
  balance_due?: number | null
  kyc_status?: string | null
}): boolean {
  const balance = applicant.balance_due ?? 0
  return (
    applicant.status === 'deposit_paid' &&
    balance > 0 &&
    isProfileKycApproved(applicant.kyc_status)
  )
}

export function canAdminSendBalanceReminder(applicant: {
  status?: string | null
  balance_due?: number | null
  kyc_status?: string | null
}): boolean {
  return canMemberPayBalance(applicant)
}

export function canAdminApproveProfile(applicant: {
  quiz_answers?: unknown
  batch_slug?: string | null
  gender?: string | null
  profile_completed_at?: string | null
  kyc_status?: string | null
}): { ok: true } | { ok: false; reason: string } {
  if (!isProfileComplete(applicant)) {
    return { ok: false, reason: 'Profile not submitted — quiz, batch, and gender required.' }
  }
  if (isProfileKycApproved(applicant.kyc_status)) {
    return { ok: false, reason: 'Profile already approved.' }
  }
  return { ok: true }
}

export function kycStatusLabel(kycStatus?: string | null): string {
  if (!kycStatus) return 'pending'
  return kycStatus.replace(/_/g, ' ')
}
