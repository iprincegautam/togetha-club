import AdminPayouts from '@/components/admin/AdminPayouts'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Payouts — Admin', 'Process partner commission payouts.')
}

export default function AdminPayoutsPage() {
  return (
    <div className="admin-page">
      <h1 className="admin-title">Payouts</h1>
      <AdminPayouts />
    </div>
  )
}
