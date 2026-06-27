import SupportChangePasswordForm from '@/components/support/SupportChangePasswordForm'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata(
    'Set Your Password — Togetha Support',
    'Choose a personal password for your support account.'
  )
}

export default function SupportChangePasswordPage() {
  return <SupportChangePasswordForm />
}
