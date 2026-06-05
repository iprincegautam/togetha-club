import AdminNotificationsCenter from '@/components/admin/AdminNotificationsCenter'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Notifications — Admin', 'Send and log partner notifications.')
}

export default function AdminNotificationsPage() {
  return (
    <div className="admin-page">
      <h1 className="admin-title">Notifications</h1>
      <AdminNotificationsCenter />
    </div>
  )
}
