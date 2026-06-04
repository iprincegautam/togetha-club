import Link from 'next/link'
import AdminApplicantsView from '@/components/admin/AdminApplicantsView'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata(
    'Admin — Togetha.Club',
    'Review applicants, payment status, and batch assignments.'
  )
}

export default function AdminPage() {
  return (
    <div className="admin-page">
      <div className="admin-card admin-card-wide">
        <p className="apply-eyebrow">✦ Admin ✦</p>
        <h1 className="admin-title">Applicants</h1>
        <p className="apply-sub" style={{ textAlign: 'left', marginBottom: 0 }}>
          Review applications, payment status, and batch assignments.
        </p>

        <div className="admin-quick-links">
          <Link href="/admin/batches" className="admin-quick-link">
            Batches & pricing
          </Link>
          <Link href="/admin/waitlist" className="admin-quick-link">
            Waitlist
          </Link>
          <Link href="/admin/affiliates" className="admin-quick-link">
            Affiliates
          </Link>
        </div>

        <AdminApplicantsView />
      </div>
    </div>
  )
}
