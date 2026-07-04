import AdminFinanceDashboard from '@/components/admin/AdminFinanceDashboard'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Finance — Admin', 'Transactions, cash flow, and per-departure gross profit.')
}

export default function AdminFinancePage() {
  return (
    <div className="admin-page">
      <h1 className="admin-title">Finance</h1>
      <AdminFinanceDashboard />
    </div>
  )
}
