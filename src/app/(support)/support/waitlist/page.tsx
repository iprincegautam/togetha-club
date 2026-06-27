import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import SupportWaitlistTable from '@/components/support/SupportWaitlistTable'
import { ROUTES } from '@/constants/routes'
import { requireSupportSession } from '@/lib/auth/support'
import { hasPermission } from '@/lib/support/permissions'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Waitlist — Support', 'View Batch C and waitlist signups.')
}

export default async function SupportWaitlistPage() {
  const ctx = await requireSupportSession()
  if (!ctx) redirect(ROUTES.supportLogin)
  if (!hasPermission(ctx.permissions, 'waitlist.view')) notFound()

  return (
    <div className="admin-page">
      <div className="admin-card admin-card-wide">
        <p className="apply-eyebrow">✦ Support ✦</p>
        <h1 className="admin-title">Waitlist</h1>
        <p className="apply-sub" style={{ textAlign: 'left' }}>
          People waiting for Batch C and future departures.{' '}
          <Link href={ROUTES.supportApplicants} className="admin-inline-link">
            ← Applicants
          </Link>
        </p>
        <SupportWaitlistTable />
      </div>
    </div>
  )
}
