import AccountSettingsPage from '@/components/account/AccountSettingsPage'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Account Settings — Togetha.Club', 'Email, password, and sign out.')
}

export default function AccountSettingsRoute() {
  return <AccountSettingsPage />
}
