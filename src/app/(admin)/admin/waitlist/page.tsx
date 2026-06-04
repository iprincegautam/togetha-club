import Link from 'next/link'
import AdminWaitlistTable from '@/components/admin/AdminWaitlistTable'
import { buildMetadata } from '@/lib/metadata'
import '@/components/admin/admin.css'

export function generateMetadata() {
  return buildMetadata('Waitlist — Admin', 'View Batch C and waitlist signups.')
}

export default function AdminWaitlistPage() {
  return (
    <div className="admin-page">
      <div className="admin-card admin-card-wide">
        <p className="apply-eyebrow">✦ Admin ✦</p>
        <h1 className="admin-title">Waitlist</h1>
        <p className="apply-sub" style={{ textAlign: 'left' }}>
          People waiting for Batch C and future departures.{' '}
          <Link href="/admin" className="admin-inline-link">← Applicants</Link>
        </p>
        <AdminWaitlistTable />
      </div>
    </div>
  )
}
