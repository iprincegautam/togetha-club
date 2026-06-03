export type ApplicantStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'deposit_paid'

export type PaymentPlan = 'deposit' | 'full'
export type Gender = 'm' | 'f'

export interface Applicant {
  id: string
  name: string | null
  email: string
  phone: string | null
  gender: Gender | null
  batchSlug: string | null
  quizScore: number | null
  compatibilityVector: Record<string, number> | null
  quizAnswers: Record<string, unknown> | null
  status: ApplicantStatus
  razorpayOrderId: string | null
  razorpayPaymentId: string | null
  createdAt: string
}
