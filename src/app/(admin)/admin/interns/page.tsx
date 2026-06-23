import Link from 'next/link'
import AdminInternsTable from '@/components/admin/AdminInternsTable'
import { ROUTES } from '@/constants/routes'
import { buildMetadata } from '@/lib/metadata'
import '@/components/admin/admin.css'

export function generateMetadata() {
  return buildMetadata(
    'Founding Team — Admin',
    'Review founding team internship applications and resumes.'
  )
}

export default function AdminInternsPage() {
  return (
    <div className="admin-page">
      <div className="admin-card admin-card-wide">
        <p className="apply-eyebrow">✦ Admin ✦</p>
        <h1 className="admin-title">Founding team</h1>
        <p className="apply-sub" style={{ textAlign: 'left' }}>
          Summer 2026 internship applications — four tracks, resume PDFs, assignment emails.{' '}
          <Link href={ROUTES.admin} className="admin-inline-link">
            ← Trip applicants
          </Link>
        </p>
        <AdminInternsTable />
      </div>
    </div>
  )
}
