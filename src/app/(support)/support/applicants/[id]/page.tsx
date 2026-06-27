import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import ApplicantOpsDetail from '@/components/applicant-ops/ApplicantOpsDetail'
import AdminApplicantPayments from '@/components/admin/AdminApplicantPayments'
import AdminResendCredentialsButton from '@/components/admin/AdminResendCredentialsButton'
import { ROUTES } from '@/constants/routes'
import { getSupportApplicantById } from '@/lib/applicant-ops/fetch-applicants'
import { buildApplicantMatchInsightResponse } from '@/lib/applicant-ops/get-applicant-detail'
import { requireSupportSession } from '@/lib/auth/support'
import {
  listApplicantPayments,
  memberBalancePayUrl,
  summarizeApplicantPayments,
} from '@/lib/applicant-payments'
import { canResendMemberCredentials } from '@/lib/applicant-payment'
import { buildApplicantMatchInsight } from '@/lib/match-analysis'
import {
  supportApplicantCapabilities,
  supportCanSendBalanceLink,
} from '@/lib/support/capabilities'
import { hasPermission } from '@/lib/support/permissions'
import { buildMetadata } from '@/lib/metadata'
import { hasQuizAnswers, normalizeQuizAnswers } from '@/lib/quiz-normalize'
import { tryCreateServiceRoleClient } from '@/lib/supabase/server'

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  return buildMetadata(`Applicant — Support`, `Review application ${id.slice(0, 8)}`)
}

export default async function SupportApplicantPage({ params }: PageProps) {
  const { id } = await params
  const ctx = await requireSupportSession()
  if (!ctx) redirect(ROUTES.supportLogin)
  if (!hasPermission(ctx.permissions, 'applicants.view')) notFound()

  const service = tryCreateServiceRoleClient()
  if (!service) notFound()

  const data = await getSupportApplicantById(
    service,
    id,
    ctx.staff.view_scope,
    ctx.profile.id
  )

  if (!data) notFound()

  let matchInsight: Record<string, unknown> | null = data.match_insight ?? null
  if (!matchInsight && hasQuizAnswers(data.quiz_answers) && data.batch_slug) {
    const { match } = await buildApplicantMatchInsight(
      service,
      normalizeQuizAnswers(data.quiz_answers),
      data.batch_slug
    )
    matchInsight = buildApplicantMatchInsightResponse(match)
  }

  const capabilities = supportApplicantCapabilities(ctx.permissions)
  const showCredentials =
    capabilities.canResendCredentials && canResendMemberCredentials(data)
  const payments = await listApplicantPayments(service, id)
  const paymentSummary = summarizeApplicantPayments(payments)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://togetha.club'

  return (
    <div className="admin-page">
      <div className="admin-card admin-card-wide">
        <p className="apply-eyebrow">✦ Support ✦</p>
        <Link href={ROUTES.supportApplicants} className="admin-inline-link">
          ← All applicants
        </Link>
        {showCredentials ? (
          <AdminResendCredentialsButton
            applicantId={data.id}
            email={data.email}
            apiPath={`/api/support/applicants/${data.id}/resend-credentials`}
          />
        ) : null}
        <AdminApplicantPayments
          applicantId={data.id}
          applicantEmail={data.email}
          balanceDue={data.balance_due}
          amountPaid={data.amount_paid}
          paymentPlan={data.payment_plan}
          status={data.status}
          payments={payments}
          totalPaidPaise={paymentSummary.totalPaidPaise}
          payUrl={memberBalancePayUrl(siteUrl)}
          apiBase="/api/support"
          canSendBalanceLink={supportCanSendBalanceLink(ctx.permissions)}
        />
        <ApplicantOpsDetail
          applicant={data}
          matchInsight={matchInsight}
          capabilities={capabilities}
        />
      </div>
    </div>
  )
}
