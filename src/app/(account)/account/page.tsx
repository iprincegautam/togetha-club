import AccountDashboard from '@/components/account/AccountDashboard'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('My Booking — Togetha.Club', 'Track your trip status, pay balance, and manage your profile.')
}

export default function AccountPage() {
  return <AccountDashboard />
}
