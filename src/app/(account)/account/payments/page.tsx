import AccountPaymentsPage from '@/components/account/AccountPaymentsPage'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Payment Methods — Togetha.Club', 'Saved cards for balance payments.')
}

export default function AccountPaymentsRoute() {
  return <AccountPaymentsPage />
}
