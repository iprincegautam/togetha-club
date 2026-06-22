import { NextRequest, NextResponse } from 'next/server'
import { BATCH_META } from '@/constants/batches'
import { ROUTES } from '@/constants/routes'
import {
  buildNurtureContext,
  buildUnlockUrl,
  buildUnsubscribeUrl,
  type ApplicantNurtureRow,
} from '@/lib/nurture/context'
import { renderNurtureEmail } from '@/lib/nurture/templates'
import type { NurtureEmailContext } from '@/lib/nurture/types'
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

function mockNurtureContext(batchSlug: MatchableBatchSlug, step: number): NurtureEmailContext {
  const meta = BATCH_META[batchSlug]
  const base = siteUrl()

  return {
    firstName: 'Prince',
    email: 'preview@togetha.club',
    applicantId: '00000000-0000-4000-8000-000000000000',
    batchSlug,
    batchLabel: meta.label,
    batchAgeRange: meta.ageRange,
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
      state: 'selected',
      label: 'Friday, 4 July 2026',
      sublabel: null,
      fomoLine: 'Your saved date — Friday, 4 July 2026 — still has open spots.',
      ctaDateLine: 'Reserve for Friday, 4 July',
    },
    vacantBoys: 7,
    vacantGirls: 5,
    vacantTotal: 12,
    depositLabel: '₹2,000',
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
  const step = Math.min(5, Math.max(1, Number(req.nextUrl.searchParams.get('step') ?? '1') || 1))
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
    ctx = mockNurtureContext(batchSlug, step)
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
