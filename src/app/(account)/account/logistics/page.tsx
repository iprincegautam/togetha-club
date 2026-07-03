import AccountLogisticsPage from '@/components/account/AccountLogisticsPage'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata(
    'Trip Logistics — Togetha.Club',
    'Pickup point, vehicle, and guide contact for your trip.'
  )
}

export default function AccountLogisticsRoute() {
  return <AccountLogisticsPage />
}
