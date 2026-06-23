import { Suspense } from 'react'
import Link from 'next/link'
import AdminApplicantsTable from '@/components/admin/AdminApplicantsTable'
import AdminAuthActions from '@/components/admin/AdminAuthActions'
import { ROUTES } from '@/constants/routes'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { fetchAdminApplicants } from '@/lib/admin-applicants'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata(
    'Admin — Togetha.Club',
    'Review applicants, payment status, and batch assignments.'
  )
}

export default async function AdminPage() {
  const auth = await requireAdminApiAccess()

  let applicants: Awaited<ReturnType<typeof fetchAdminApplicants>> = []
  let loadError: string | null = null

  if ('error' in auth) {
    loadError = auth.error ?? 'Unauthorized'
  } else {
    try {
      applicants = await fetchAdminApplicants(auth.service)
    } catch (err) {
      console.error('[admin page applicants]', err)
      loadError = 'Could not load applicants'
    }
  }

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
          <Link href={ROUTES.adminInterns} className="admin-quick-link">
            Founding team
          </Link>
          <Link href="/admin/affiliates" className="admin-quick-link">
            Affiliates
          </Link>
        </div>

        {loadError ? (
          <AdminAuthActions
            message={`${loadError}. Sign out, then sign in again with your admin account.`}
          />
        ) : (
          <Suspense fallback={<p className="admin-loading">Loading applicants…</p>}>
            <AdminApplicantsTable applicants={applicants} />
          </Suspense>
        )}
      </div>
    </div>
  )
}
