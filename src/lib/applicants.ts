import type { ApplicantStatus } from '@/types/applicant'

type BatchRelation = { name: string; slug: string } | { name: string; slug: string }[] | null
type PromoRelation = { code: string } | { code: string }[] | null

export function parseBatchRelation(batches: BatchRelation): { name: string; slug: string } | null {
  if (!batches) return null
  if (Array.isArray(batches)) return batches[0] ?? null
  return batches
}

function parsePromoRelation(promo: PromoRelation): string | null {
  if (!promo) return null
  if (Array.isArray(promo)) return promo[0]?.code ?? null
  return promo.code
}

export interface ApplicantDbRow {
  id: string
  name: string | null
  email: string
  phone: string | null
  gender: string | null
  batch_slug: string | null
  date_choice?: string | null
  quiz_answers?: unknown
  quiz_score: number | null
  status: string
  created_at: string
  priority_review?: boolean
  lead_source?: string | null
  assigned_support_id?: string | null
  profile_completed_at?: string | null
  kyc_status?: string | null
  balance_due?: number | null
  batches: BatchRelation
  promo_codes?: PromoRelation
  batch_departures?: { label: string } | { label: string }[] | null
}

export function mapApplicantRow(row: ApplicantDbRow) {
  const batch = parseBatchRelation(row.batches)
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? null,
    gender: row.gender as 'm' | 'f' | null,
    batchSlug: row.batch_slug,
    batchName: batch?.name ?? null,
    quizScore: row.quiz_score,
    status: row.status as ApplicantStatus,
    createdAt: row.created_at,
    promoCode: parsePromoRelation(row.promo_codes ?? null),
    priorityReview: row.priority_review ?? false,
    leadSource: row.lead_source ?? null,
    isQuizLead: Boolean(row.phone && row.quiz_score != null && row.quiz_score > 0),
  }
}
