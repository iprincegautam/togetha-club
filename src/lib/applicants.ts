import type { ApplicantStatus } from '@/types/applicant'

type BatchRelation = { name: string; slug: string } | { name: string; slug: string }[] | null

export function parseBatchRelation(batches: BatchRelation): { name: string; slug: string } | null {
  if (!batches) return null
  if (Array.isArray(batches)) return batches[0] ?? null
  return batches
}

export interface ApplicantDbRow {
  id: string
  name: string | null
  email: string
  gender: string | null
  batch_slug: string | null
  quiz_score: number | null
  status: string
  created_at: string
  batches: BatchRelation
}

export function mapApplicantRow(row: ApplicantDbRow) {
  const batch = parseBatchRelation(row.batches)
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    gender: row.gender as 'm' | 'f' | null,
    batchSlug: row.batch_slug,
    batchName: batch?.name ?? null,
    quizScore: row.quiz_score,
    status: row.status as ApplicantStatus,
    createdAt: row.created_at,
  }
}
