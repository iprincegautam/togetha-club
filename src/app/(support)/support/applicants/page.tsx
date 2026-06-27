import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import ApplicantOpsList from '@/components/applicant-ops/ApplicantOpsList'
import { ROUTES } from '@/constants/routes'
import { fetchSupportApplicants } from '@/lib/applicant-ops/fetch-applicants'
import { requireSupportSession } from '@/lib/auth/support'
import { hasPermission } from '@/lib/support/permissions'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Applicants — Support', 'View and guide applicants through booking.')
}

export default async function SupportApplicantsPage() {
  const ctx = await requireSupportSession()
  if (!ctx) redirect(ROUTES.supportLogin)
  if (!hasPermission(ctx.permissions, 'applicants.view')) notFound()

  const { tryCreateServiceRoleClient } = await import('@/lib/supabase/server')
  const service = tryCreateServiceRoleClient()
  if (!service) {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <p className="apply-error">Server configuration error.</p>
        </div>
      </div>
    )
  }

  let applicants: Awaited<ReturnType<typeof fetchSupportApplicants>> = []
  let loadError: string | null = null

  try {
    applicants = await fetchSupportApplicants(service, ctx.staff.view_scope, ctx.profile.id)
  } catch (err) {
    console.error('[support applicants page]', err)
    loadError = 'Could not load applicants'
  }

  return (
    <div className="admin-page">
      <div className="admin-card admin-card-wide">
        <p className="apply-eyebrow">✦ Support ✦</p>
        <h1 className="admin-title">Applicants</h1>
        <p className="apply-sub" style={{ textAlign: 'left' }}>
          {ctx.staff.view_scope === 'all' ? 'All applicants' : 'Assigned to you only'}
        </p>

        {loadError ? (
          <p className="apply-error">{loadError}</p>
        ) : (
          <Suspense fallback={<p className="admin-loading">Loading applicants…</p>}>
            <ApplicantOpsList applicants={applicants} variant="support" />
          </Suspense>
        )}
      </div>
    </div>
  )
}
