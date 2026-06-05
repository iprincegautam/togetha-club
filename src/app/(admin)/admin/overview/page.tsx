import AdminOverview from '@/components/admin/AdminOverview'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Admin Overview — Togetha.Club', 'KPI dashboard and alerts.')
}

export default function AdminOverviewPage() {
  return (
    <div className="admin-page">
      <p className="apply-eyebrow">✦ Admin ✦</p>
      <h1 className="admin-title">Overview</h1>
      <AdminOverview />
    </div>
  )
}
