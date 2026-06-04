import PartnerForgotPasswordForm from '@/components/partner/PartnerForgotPasswordForm'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Partner Forgot Password — Togetha.Club', 'Reset your partner portal password.')
}

export default function PartnerForgotPasswordPage() {
  return <PartnerForgotPasswordForm />
}
