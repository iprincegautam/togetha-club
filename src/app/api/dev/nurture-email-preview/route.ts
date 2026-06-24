import { NextRequest, NextResponse } from 'next/server'
import { BATCH_META } from '@/constants/batches'
import { ROUTES } from '@/constants/routes'
import {
  buildNurtureContext,
  buildUnlockUrl,
  buildUnsubscribeUrl,
  type ApplicantNurtureRow,
} from '@/lib/nurture/context'
import { buildUrgencyCopy } from '@/lib/nurture/departure-urgency'
import { renderNurtureEmail } from '@/lib/nurture/templates'
import type { DepartureUrgencyTier, NurtureEmailContext } from '@/lib/nurture/types'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { MatchableBatchSlug } from '@/types/match'

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  )
}

function parseBatchSlug(value: string | null): MatchableBatchSlug {
  return value === 'batch-b' ? 'batch-b' : 'batch-a'
}

function parseTier(value: string | null): DepartureUrgencyTier {
  const allowed: DepartureUrgencyTier[] = [
    'no_date',
    'standard',
    'warm',
    'urgent',
    'critical',
    'passed',
  ]
  return allowed.includes(value as DepartureUrgencyTier) ? (value as DepartureUrgencyTier) : 'warm'
}

function mockCohortPeople() {
  return [
    {
      id: 'preview-1',
      displayName: 'A*** S.',
      role: 'Product Designer',
      orgLine: 'Lead · Swiggy',
      vibeLabel: 'Thoughtful planner energy',
      avatarClass: 'av-teal' as const,
    },
    {
      id: 'preview-2',
      displayName: 'R*** K.',
      role: 'Engineering student · B.Tech · CS',
      orgLine: 'IIT Delhi · 3rd year',
      vibeLabel: 'Bonfire romantic energy',
      avatarClass: 'av-rose' as const,
    },
    {
      id: 'preview-3',
      displayName: 'K*** M.',
      role: 'Marketing Manager',
      orgLine: 'Senior · CRED',
      vibeLabel: 'Golden retriever energy',
      avatarClass: 'av-gold' as const,
    },
  ]
}

function mockNurtureContext(
  batchSlug: MatchableBatchSlug,
  step: number,
  tier: DepartureUrgencyTier
): NurtureEmailContext {
  const meta = BATCH_META[batchSlug]
  const base = siteUrl()
  const pickedLabel = 'Friday, 26 June 2026'
  const daysUntil =
    tier === 'critical' ? 2 : tier === 'urgent' ? 5 : tier === 'passed' ? -3 : 14
  const urgency = buildUrgencyCopy({
    tier,
    pickedLabel,
    effectiveLabel: tier === 'passed' ? 'Friday, 3 July 2026' : pickedLabel,
    daysUntil: tier === 'no_date' ? null : daysUntil,
    pivotLabel: 'Friday, 3 July 2026',
    pivotDaysUntil: 9,
    nearestLabel: 'Friday, 3 July 2026',
    vacantTotal: 8,
    batchLabel: meta.label,
  })

  return {
    firstName: 'Prince',
    email: 'preview@togetha.club',
    applicantId: '00000000-0000-4000-8000-000000000000',
    batchSlug,
    batchLabel: meta.label,
    batchAgeRange: meta.ageRange,
    matchScore: 87,
    fitTier: 'strong',
    peerArchetype: 'The Bonfire Romantic',
    peerTagline: 'One-on-one depth and slow burns',
    metaphor: {
      state: 'full',
      tease: 'something about bonfires and slow burns',
      raw: 'A bonfire on a cold night — warm at the center, quiet at the edges.',
    },
    mountains: {
      state: 'full',
      tease: 'mountains strip pretense',
      raw: 'Mountains make honesty feel inevitable.',
    },
    departure: {
      state: tier === 'passed' ? 'passed' : tier === 'no_date' ? 'skipped' : 'selected',
      label: tier === 'no_date' ? null : pickedLabel,
      effectiveLabel: tier === 'passed' ? 'Friday, 3 July 2026' : pickedLabel,
      sublabel: null,
      tier,
      daysUntil: tier === 'no_date' ? null : daysUntil,
      isPassed: tier === 'passed',
      pivotLabel: tier === 'passed' ? 'Friday, 3 July 2026' : null,
      fomoLine: urgency.fomoLine,
      ctaDateLine: urgency.ctaDateLine,
      urgencyPrefix: urgency.urgencyPrefix,
      tone: urgency.tone,
    },
    cohort: {
      likeYouCount: 8,
      people: mockCohortPeople(),
      urgencyLine: `Only 5 spots left for upcoming ${meta.label} departures`,
      moreHiddenCount: 5,
    },
    vacantBoys: 4,
    vacantGirls: 4,
    vacantTotal: 8,
    depositLabel: '₹3,000',
    unlockUrl: buildUnlockUrl('00000000-0000-4000-8000-000000000000', batchSlug, step),
    batchUrl: `${base}${ROUTES.batchDetail(batchSlug)}?src=preview`,
    unsubscribeUrl: buildUnsubscribeUrl('preview@togetha.club'),
    quizAnswers: {},
  }
}

/** Local-only preview for nurture emails (no Resend required). */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Preview only available in development' }, { status: 404 })
  }

  const batchSlug = parseBatchSlug(req.nextUrl.searchParams.get('batch'))
  const step = Math.min(6, Math.max(1, Number(req.nextUrl.searchParams.get('step') ?? '1') || 1))
  const tier = parseTier(req.nextUrl.searchParams.get('tier'))
  const format = req.nextUrl.searchParams.get('format') === 'text' ? 'text' : 'html'
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase() ?? ''

  let ctx: NurtureEmailContext | null = null

  if (email) {
    try {
      const supabase = createServiceRoleClient()
      const { data: applicant, error } = await supabase
        .from('applicants')
        .select('id, email, name, batch_slug, quiz_answers, quiz_score, date_choice, razorpay_payment_id')
        .eq('email', email)
        .maybeSingle()

      if (error) throw error
      if (!applicant) {
        return NextResponse.json({ error: `No applicant found for ${email}` }, { status: 404 })
      }

      ctx = await buildNurtureContext(supabase, applicant as ApplicantNurtureRow, step)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'context_build_failed'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  } else {
    ctx = mockNurtureContext(batchSlug, step, tier)
  }

  if (!ctx) {
    return NextResponse.json({ error: 'Could not build email context' }, { status: 500 })
  }

  const content = renderNurtureEmail(step, ctx)

  if (format === 'text') {
    return new NextResponse(`Subject: ${content.subject}\n\n${content.text}`, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  return new NextResponse(content.html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
