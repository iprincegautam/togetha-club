import { redirect } from 'next/navigation'
import MemberCompleteProfileFlow from '@/components/account/MemberCompleteProfileFlow'
import { getMemberContext } from '@/lib/auth/member'
import { hasVerifiedPayment } from '@/lib/applicant-payment'
import { isProfileComplete } from '@/lib/payment-claim'
import { ROUTES } from '@/constants/routes'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata(
  'Complete your profile | Togetha.Club',
  'Take the quiz and choose your batch after payment.'
)

export default async function CompleteProfilePage() {
  const ctx = await getMemberContext()
  if (!ctx.session) {
    redirect(`${ROUTES.accountLogin}?next=${ROUTES.accountCompleteProfile}`)
  }
  if (!ctx.applicant) {
    redirect(ROUTES.account)
  }
  if (!hasVerifiedPayment(ctx.applicant)) {
    redirect(ROUTES.account)
  }
  if (isProfileComplete(ctx.applicant)) {
    redirect(ROUTES.account)
  }

  return <MemberCompleteProfileFlow />
}
