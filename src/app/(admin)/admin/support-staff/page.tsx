import AdminSupportStaffManager from '@/components/admin/AdminSupportStaffManager'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata(
    'Support Staff — Admin',
    'Provision support portal logins and manage permissions.'
  )
}

export default function AdminSupportStaffPage() {
  return (
    <div className="admin-page">
      <div className="admin-card admin-card-wide">
        <p className="apply-eyebrow">✦ Admin ✦</p>
        <h1 className="admin-title">Support staff</h1>
        <p className="apply-sub" style={{ textAlign: 'left' }}>
          Onboard sales and support team members with scoped access to the support portal at{' '}
          <code>/support/login</code>.
        </p>
        <AdminSupportStaffManager />
      </div>
    </div>
  )
}
