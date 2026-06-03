import Link from 'next/link'
import AdminAffiliatesDashboard from '@/components/admin/AdminAffiliatesDashboard'
import { buildMetadata } from '@/lib/metadata'
import '@/components/admin/admin.css'

export function generateMetadata() {
  return buildMetadata(
    'Affiliates — Togetha.Club Admin',
    'Track influencer promo codes, redemptions, and commissions.'
  )
}

export default function AdminAffiliatesPage() {
  return (
    <div className="admin-page">
      <div className="admin-card admin-card-wide">
        <p className="apply-eyebrow">✦ Admin ✦</p>
        <h1 className="admin-title">Affiliates &amp; Promo Codes</h1>
        <p className="apply-sub" style={{ textAlign: 'left', marginBottom: 16 }}>
          Track influencer bookings, promo usage, and commission owed.
        </p>
        <p className="admin-nav-links">
          <Link href="/admin">← Applicants</Link>
        </p>
        <AdminAffiliatesDashboard />
      </div>
    </div>
  )
}
