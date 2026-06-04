import Link from 'next/link'
import AdminBatchesManager from '@/components/admin/AdminBatchesManager'
import { buildMetadata } from '@/lib/metadata'
import '@/components/admin/admin.css'

export function generateMetadata() {
  return buildMetadata('Batches — Admin', 'Manage batch pricing, status, and inventory.')
}

export default function AdminBatchesPage() {
  return (
    <div className="admin-page">
      <div className="admin-card admin-card-wide">
        <p className="apply-eyebrow">✦ Admin ✦</p>
        <h1 className="admin-title">Batches</h1>
        <p className="apply-sub" style={{ textAlign: 'left' }}>
          Update prices, spot counts, and status without touching code.{' '}
          <Link href="/admin" className="admin-inline-link">← Applicants</Link>
        </p>
        <AdminBatchesManager />
      </div>
    </div>
  )
}
