import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminApplicantDetail from '@/components/admin/AdminApplicantDetail'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { buildApplicantMatchInsight } from '@/lib/match-analysis'
import { buildMetadata } from '@/lib/metadata'
import { hasQuizAnswers, normalizeQuizAnswers } from '@/lib/quiz-normalize'
import '@/components/admin/admin.css'

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  return buildMetadata(`Applicant — Admin`, `Review application ${id.slice(0, 8)}`)
}

export default async function AdminApplicantPage({ params }: PageProps) {
  const { id } = await params
  const auth = await requireAdminApiAccess()

  if (!auth || 'error' in auth) {
    notFound()
  }

  const { data, error } = await auth.service
    .from('applicants')
    .select(
      `
      *,
      batches ( name, slug ),
      promo_codes ( code )
    `
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    notFound()
  }

  let matchInsight: Record<string, unknown> | null = data.match_insight ?? null
  if (!matchInsight && hasQuizAnswers(data.quiz_answers) && data.batch_slug) {
    const { match } = await buildApplicantMatchInsight(
      auth.service,
      normalizeQuizAnswers(data.quiz_answers),
      data.batch_slug
    )
    if (match) {
      matchInsight = {
        matchScore: match.matchScore,
        placementChance: match.placementChance,
        cohortMatchPercent: match.cohortMatchPercent,
        cohortStrongMatchPercent: match.cohortStrongMatchPercent,
        cohortSampleSize: match.cohortSampleSize,
        aiNarrative: match.aiNarrative,
        peerMix: match.peerMix,
        confidence: match.confidence,
      }
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-card admin-card-wide">
        <p className="apply-eyebrow">✦ Admin ✦</p>
        <Link href="/admin" className="admin-inline-link">← All applicants</Link>
        <AdminApplicantDetail applicant={data} matchInsight={matchInsight} />
      </div>
    </div>
  )
}
