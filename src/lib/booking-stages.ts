import { isProfileKycApproved, isProfileKycRejected } from '@/lib/applicant-kyc'

export type BookingStage =
  | 'applied'
  | 'deposit_paid'
  | 'paid'
  | 'under_review'
  | 'approved'
  | 'rejected'

export function bookingStageFromStatus(status: string): BookingStage {
  switch (status) {
    case 'deposit_paid':
      return 'deposit_paid'
    case 'paid':
      return 'paid'
    case 'approved':
      return 'approved'
    case 'rejected':
      return 'rejected'
    case 'pending':
    default:
      return 'applied'
  }
}

export const BOOKING_STAGES: { id: BookingStage; label: string }[] = [
  { id: 'applied', label: 'Application received' },
  { id: 'deposit_paid', label: 'Deposit paid' },
  { id: 'paid', label: 'Paid in full' },
  { id: 'under_review', label: 'Under review' },
  { id: 'approved', label: 'Approved for trip' },
]

export type BookingPipelineState = {
  /** Last step index that is fully complete (inclusive). */
  completedThrough: number
  /** Active step index — may be ahead of completedThrough when action is pending. */
  currentIndex: number
}

/** @deprecated Use bookingPipelineState — kept for callers that only need a single index. */
export function activeStageIndex(
  status: string,
  kycStatus?: string,
  profileComplete?: boolean,
  balanceDue?: number | null
): number {
  return bookingPipelineState(status, kycStatus, profileComplete, balanceDue).currentIndex
}

export function bookingPipelineState(
  status: string,
  kycStatus?: string,
  profileComplete?: boolean,
  balanceDue?: number | null
): BookingPipelineState {
  const balance = balanceDue ?? 0
  const kycApproved = isProfileKycApproved(kycStatus)

  if (status === 'rejected') {
    return { completedThrough: 4, currentIndex: 4 }
  }

  if (isProfileKycRejected(kycStatus)) {
    return { completedThrough: 1, currentIndex: 3 }
  }

  if (status === 'approved') {
    return { completedThrough: 4, currentIndex: 4 }
  }

  if (status === 'paid' && profileComplete) {
    return { completedThrough: 4, currentIndex: 4 }
  }

  if (status === 'paid') {
    return { completedThrough: 2, currentIndex: profileComplete ? 3 : 2 }
  }

  if (status === 'deposit_paid') {
    if (!profileComplete) {
      return { completedThrough: 1, currentIndex: 1 }
    }

    if (!kycApproved) {
      // Profile submitted — waiting for admin to approve before balance opens.
      return { completedThrough: 1, currentIndex: 3 }
    }

    if (balance > 0) {
      // Profile approved — balance optional until departure; under review complete.
      return { completedThrough: 3, currentIndex: 2 }
    }

    // Edge case: zero balance but still deposit_paid — ready for final approval.
    return { completedThrough: 2, currentIndex: 4 }
  }

  return { completedThrough: 0, currentIndex: 0 }
}
