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

export function activeStageIndex(
  status: string,
  kycStatus?: string,
  profileComplete?: boolean
): number {
  if (status === 'rejected') return 4
  if (status === 'approved') return 4
  if (status === 'paid' && profileComplete) return 4
  if (kycStatus === 'approved') return 4
  if (status === 'paid' || status === 'deposit_paid') {
    if (profileComplete || kycStatus === 'submitted') return 3
    return status === 'paid' ? 2 : 1
  }
  return 0
}
