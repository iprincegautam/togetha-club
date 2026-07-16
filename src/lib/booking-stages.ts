import { isProfileKycApproved, isProfileKycRejected } from '@/lib/applicant-kyc'

export type BookingStage =
  | 'applied'
  | 'deposit_paid'
  | 'paid'
  | 'under_review'
  | 'approved'
  | 'rejected'

export type BookingStepState = 'done' | 'current' | 'pending'

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
  /** Last step index that is fully complete (inclusive). Kept for legacy callers. */
  completedThrough: number
  /** Active step index — may be ahead of completedThrough when action is pending. */
  currentIndex: number
  /** Explicit UI state per step — avoids false checkmarks on skipped optional steps. */
  stepStates: BookingStepState[]
}

function pipeline(
  stepStates: BookingStepState[],
  currentIndex: number
): BookingPipelineState {
  let completedThrough = -1
  stepStates.forEach((state, i) => {
    if (state === 'done') completedThrough = i
  })
  return { completedThrough, currentIndex, stepStates }
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
    return pipeline(['done', 'done', 'done', 'done', 'current'], 4)
  }

  if (isProfileKycRejected(kycStatus)) {
    return pipeline(['done', 'done', 'pending', 'current', 'pending'], 3)
  }

  if (status === 'approved' || (status === 'paid' && profileComplete)) {
    return pipeline(['done', 'done', 'done', 'done', 'current'], 4)
  }

  if (status === 'paid') {
    return pipeline(
      ['done', 'done', 'current', profileComplete ? 'done' : 'pending', 'pending'],
      profileComplete ? 3 : 2
    )
  }

  if (status === 'deposit_paid') {
    if (!profileComplete) {
      return pipeline(['done', 'current', 'pending', 'pending', 'pending'], 1)
    }

    if (!kycApproved) {
      return pipeline(['done', 'done', 'pending', 'current', 'pending'], 3)
    }

    if (balance > 0) {
      // Approved for trip — balance due within 48h of approval (step 2 stays open until paid).
      // NOTE: copy reflects the 48h deadline; enforcing auto-release is a separate logic change.
      return pipeline(['done', 'done', 'pending', 'done', 'current'], 4)
    }

    return pipeline(['done', 'done', 'done', 'done', 'current'], 4)
  }

  return pipeline(['current', 'pending', 'pending', 'pending', 'pending'], 0)
}
