import AccountProfileForm from '@/components/account/AccountProfileForm'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('My Profile — Togetha.Club', 'Complete your trip profile for Togetha.Club.')
}

export default function AccountProfilePage() {
  return <AccountProfileForm />
}
