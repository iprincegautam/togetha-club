import AccountForgotPasswordForm from '@/components/account/AccountForgotPasswordForm'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Forgot Password — Togetha.Club', 'Reset your member account password.')
}

export default function AccountForgotPasswordPage() {
  return <AccountForgotPasswordForm />
}
