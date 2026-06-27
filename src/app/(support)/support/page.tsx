import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { fetchSupportApplicants } from '@/lib/applicant-ops/fetch-applicants'
import { requireSupportSession } from '@/lib/auth/support'
import { bookingStageFromStatus } from '@/lib/booking-stages'
import { hasPermission } from '@/lib/support/permissions'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Support Dashboard — Togetha.Club', 'Your assigned applicants and booking pipeline.')
}

export default async function SupportDashboardPage() {
  const ctx = await requireSupportSession()
  if (!ctx) redirect(ROUTES.supportLogin)

  if (!hasPermission(ctx.permissions, 'applicants.view')) {
    notFound()
  }

  const { tryCreateServiceRoleClient } = await import('@/lib/supabase/server')
  const service = tryCreateServiceRoleClient()
  if (!service) notFound()

  const applicants = await fetchSupportApplicants(
    service,
    ctx.staff.view_scope,
    ctx.profile.id
  )

  const stageCounts: Record<string, number> = {}
  let needsAction = 0

  for (const row of applicants) {
    const stage = bookingStageFromStatus(row.status)
    stageCounts[stage] = (stageCounts[stage] ?? 0) + 1

    const profileComplete = Boolean(row.profileCompletedAt)
    const balanceDue = row.balanceDue ?? 0
    if (
      row.status === 'pending' ||
      (row.status === 'deposit_paid' && !profileComplete) ||
      (row.status === 'deposit_paid' && balanceDue > 0 && row.kycStatus === 'approved')
    ) {
      needsAction += 1
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-card admin-card-wide">
        <p className="apply-eyebrow">✦ Support ✦</p>
        <h1 className="admin-title">Dashboard</h1>
        <p className="apply-sub" style={{ textAlign: 'left' }}>
          {ctx.staff.view_scope === 'all'
            ? 'All applicants'
            : 'Applicants assigned to you'}
          {' · '}
          <Link href={ROUTES.supportApplicants} className="admin-inline-link">
            View list →
          </Link>
        </p>

        <div className="admin-stat-grid">
          <div className="admin-stat">
            <div className="admin-stat-num">{applicants.length}</div>
            <div className="admin-stat-label">Total in scope</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-num">{needsAction}</div>
            <div className="admin-stat-label">Needs follow-up</div>
          </div>
          {Object.entries(stageCounts).map(([stage, count]) => (
            <div className="admin-stat" key={stage}>
              <div className="admin-stat-num">{count}</div>
              <div className="admin-stat-label">{stage.replace('_', ' ')}</div>
            </div>
          ))}
        </div>

        {applicants.length === 0 ? (
          <p className="account-muted" style={{ marginTop: 24 }}>
            No applicants in your scope yet. Ask admin to assign leads, or provision a direct login
            if you have that permission.
          </p>
        ) : (
          <div className="admin-panel" style={{ marginTop: 24 }}>
            <h3 className="admin-panel-title">Recent applicants</h3>
            <ul className="admin-stack" style={{ listStyle: 'none', padding: 0 }}>
              {applicants.slice(0, 8).map((row) => (
                <li key={row.id}>
                  <Link href={ROUTES.supportApplicant(row.id)} className="admin-inline-link">
                    {row.name || row.email}
                  </Link>
                  {' · '}
                  {row.status}
                  {row.phone ? ` · ${row.phone}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
