import { createHmac } from 'crypto'
import { BATCH_META } from '@/constants/batches'
import {
  parseBatchDepartureRelation,
  resolveApplicantDepartureLabel,
} from '@/lib/applicant-departure'
import { depositAmountForTotal } from '@/lib/payment-plan'
import { analyzeMatchProfile } from '@/lib/match-engine'
import { buildBatchCohortTeaser } from '@/lib/match-cohort-preview'
import { resolveDepartureUrgency } from '@/lib/nurture/departure-urgency'
import { readDepartureFromQuiz } from '@/lib/nurture/departure'
import {
  readMetaphorAnswer,
  readMountainsAnswer,
  teaseFromText,
} from '@/lib/nurture/tease'
import type { NurtureEmailContext } from '@/lib/nurture/types'
import { QUIZ_DEPARTURE_QUESTION_ID } from '@/lib/batch-age'
import { normalizeQuizAnswers } from '@/lib/quiz-normalize'
import { ROUTES } from '@/constants/routes'
import { isBookableBatchSlug, getDestinationForBatch } from '@/constants/destinations'
import { batchPriceFallbackRupees } from '@/lib/batch-price-fallbacks'
import type { MatchableBatchSlug } from '@/types/match'
import type { SupabaseClient } from '@supabase/supabase-js'

export type ApplicantNurtureRow = {
  id: string
  email: string
  name: string | null
  batch_slug: string | null
  quiz_answers: unknown
  quiz_score: number | null
  date_choice: string | null
  razorpay_payment_id: string | null
  profile_completed_at?: string | null
  created_at?: string | null
  batch_departures?: { label: string } | { label: string }[] | null
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://togetha.club').replace(
    /\/$/,
    ''
  )
}

function firstName(name: string | null): string {
  const trimmed = name?.trim()
  if (!trimmed) return 'there'
  return trimmed.split(/\s+/)[0] ?? 'there'
}

function isMatchableBatch(slug: string | null): slug is MatchableBatchSlug {
  return isBookableBatchSlug(slug ?? '')
}

export function buildUnsubscribeUrl(email: string): string {
  const secret = process.env.NURTURE_UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev'
  const token = createHmac('sha256', secret).update(email.toLowerCase()).digest('hex').slice(0, 20)
  return `${siteUrl()}/api/email/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`
}

export function buildUnlockUrl(applicantId: string, batchSlug: string, step: number): string {
  return `${siteUrl()}${ROUTES.apply(batchSlug)}?aid=${applicantId}&src=e${step}`
}

async function fetchBatchMeta(
  supabase: SupabaseClient,
  batchSlug: MatchableBatchSlug
): Promise<{ priceRupees: number; spotsTakenM: number; spotsTakenF: number }> {
  const { data } = await supabase
    .from('batches')
    .select('price, spots_taken_m, spots_taken_f')
    .eq('slug', batchSlug)
    .maybeSingle()

  return {
    priceRupees: data?.price ?? batchPriceFallbackRupees(batchSlug),
    spotsTakenM: data?.spots_taken_m ?? 0,
    spotsTakenF: data?.spots_taken_f ?? 0,
  }
}

export async function buildNurtureContext(
  supabase: SupabaseClient,
  applicant: ApplicantNurtureRow,
  emailStep: number
): Promise<NurtureEmailContext | null> {
  const batchSlug = isMatchableBatch(applicant.batch_slug)
    ? applicant.batch_slug
    : 'batch-a'

  const answers = normalizeQuizAnswers(applicant.quiz_answers)
  const destination = getDestinationForBatch(batchSlug) ?? 'himalayan'
  const analysis = analyzeMatchProfile(answers, destination)
  const primary =
    analysis.batches.find((b) => b.batchSlug === batchSlug) ?? analysis.batches[0]
  const peer = primary?.peerMix[0]
  const meta = BATCH_META[batchSlug]

  const metaphor = readMetaphorAnswer(answers)
  const mountains = readMountainsAnswer(answers)
  const quizDeparture = readDepartureFromQuiz(answers)
  const quizLabel =
    quizDeparture.state === 'selected'
      ? quizDeparture.label
      : resolveApplicantDepartureLabel(applicant.date_choice, batchSlug, {
          departureLabel: parseBatchDepartureRelation(applicant.batch_departures),
          quizAnswers: applicant.quiz_answers,
          bookedAt: applicant.profile_completed_at ?? applicant.created_at,
        })

  const batchData = await fetchBatchMeta(supabase, batchSlug)
  const vacantBoys = Math.max(0, 12 - batchData.spotsTakenM)
  const vacantGirls = Math.max(0, 12 - batchData.spotsTakenF)
  const vacantTotal = vacantBoys + vacantGirls

  const urgency = await resolveDepartureUrgency(supabase, batchSlug, {
    quizLabel,
    dateChoice: applicant.date_choice,
    vacantTotal,
    batchLabel: meta.label,
  })

  const cohortTeaser = primary
    ? buildBatchCohortTeaser(answers, primary)
    : {
        likeYouCount: 6,
        people: [],
        urgencyLine: `Spots open on ${meta.label}`,
      }

  const depositPaise = depositAmountForTotal(batchData.priceRupees * 100)
  const depositLabel = `₹${Math.round(depositPaise / 100).toLocaleString('en-IN')}`

  const score = primary?.matchScore ?? applicant.quiz_score ?? 72

  return {
    firstName: firstName(applicant.name),
    email: applicant.email,
    applicantId: applicant.id,
    batchSlug,
    batchLabel: meta.label,
    batchAgeRange: meta.ageRange,
    matchScore: score,
    fitTier: score >= 82 ? 'strong' : 'solid',
    peerArchetype: peer?.label ?? 'The Bonfire Romantic',
    peerTagline: peer?.tagline ?? 'One-on-one depth and slow burns',
    metaphor: {
      state: metaphor.state,
      tease: metaphor.raw ? teaseFromText(metaphor.raw) : null,
      raw: metaphor.raw,
    },
    mountains: {
      state: mountains.state,
      tease: mountains.raw ? teaseFromText(mountains.raw) : null,
      raw: mountains.raw,
    },
    departure: {
      state: urgency.state,
      label: urgency.pickedLabel,
      effectiveLabel: urgency.effectiveLabel,
      sublabel: null,
      tier: urgency.tier,
      daysUntil: urgency.daysUntil,
      isPassed: urgency.isPassed,
      pivotLabel: urgency.pivotLabel,
      fomoLine: urgency.fomoLine,
      ctaDateLine: urgency.ctaDateLine,
      urgencyPrefix: urgency.urgencyPrefix,
      tone: urgency.tone,
    },
    cohort: {
      likeYouCount: cohortTeaser.likeYouCount,
      people: cohortTeaser.people.slice(0, 4),
      urgencyLine: cohortTeaser.urgencyLine,
      moreHiddenCount: Math.max(0, cohortTeaser.likeYouCount - Math.min(4, cohortTeaser.people.length)),
    },
    vacantBoys,
    vacantGirls,
    vacantTotal,
    depositLabel,
    unlockUrl: buildUnlockUrl(applicant.id, batchSlug, emailStep),
    batchUrl: `${siteUrl()}${ROUTES.batchDetail(batchSlug)}?src=e${emailStep}`,
    unsubscribeUrl: buildUnsubscribeUrl(applicant.email),
    quizAnswers: answers,
  }
}

export function extractDateChoiceFromAnswers(answers: unknown): string | null {
  const normalized = normalizeQuizAnswers(answers)
  const raw = normalized[QUIZ_DEPARTURE_QUESTION_ID]
  if (typeof raw !== 'string') return null
  const label = raw.trim()
  return label || null
}
