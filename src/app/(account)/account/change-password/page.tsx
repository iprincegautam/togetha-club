import AccountChangePasswordForm from '@/components/account/AccountChangePasswordForm'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata(
    'Set Your Password — Togetha.Club',
    'Choose a personal password for your member account.'
  )
}

export default function AccountChangePasswordPage() {
  return <AccountChangePasswordForm firstLogin />
}
