import { isResendConfigured, resend } from '@/lib/resend'
import {
  buildNurtureContext,
  type ApplicantNurtureRow,
} from '@/lib/nurture/context'
import {
  NURTURE_SEQUENCE_KEY,
  NURTURE_SEQUENCE_KEY_V1,
  NURTURE_SEQUENCE_KEY_V2,
  NURTURE_SEQUENCE_KEYS,
} from '@/lib/nurture/constants'
import { resolveDepartureUrgency, shouldStopAfterDepartureWindow } from '@/lib/nurture/departure-urgency'
import { readDepartureFromQuiz } from '@/lib/nurture/departure'
import { resolveApplicantDepartureLabel } from '@/lib/admin-applicant-filters'
import { logSupabaseError } from '@/lib/nurture/db-log'
import {
  maxStepForSequenceKey,
  maybePullForwardSendAt,
  nextSendAt,
} from '@/lib/nurture/schedule'
import {
  applicantShouldStopNurture,
  isEmailUnsubscribed,
  stopNurtureSequence,
} from '@/lib/nurture/should-stop'
import { renderNurtureEmail } from '@/lib/nurture/templates'
import type { DepartureUrgencyTier, NurtureEmailContext } from '@/lib/nurture/types'
import { normalizeQuizAnswers } from '@/lib/quiz-normalize'
import { BATCH_META } from '@/constants/batches'
import type { MatchableBatchSlug } from '@/types/match'
import type { SupabaseClient } from '@supabase/supabase-js'

export type NurtureEnrollResult = {
  ok: boolean
  error?: string
  emailSent?: boolean
  resendId?: string
}

function isMissingNurtureTable(error: { message?: string } | null): boolean {
  const msg = error?.message ?? ''
  return msg.includes('email_sequences') || msg.includes('email_sends') || msg.includes('does not exist')
}

function isMatchableBatch(slug: string | null): slug is MatchableBatchSlug {
  return slug === 'batch-a' || slug === 'batch-b'
}

async function logEmailSend(
  supabase: SupabaseClient,
  row: {
    applicant_id: string
    sequence_id: string | null
    step: number
    subject: string
    resend_message_id?: string | null
    failed_at?: string
    error?: string
  }
): Promise<void> {
  const { error } = await supabase.from('email_sends').insert(row)
  logSupabaseError('email_sends insert', error)
}

async function resolveTierForApplicant(
  supabase: SupabaseClient,
  applicant: ApplicantNurtureRow
): Promise<DepartureUrgencyTier> {
  const batchSlug = isMatchableBatch(applicant.batch_slug) ? applicant.batch_slug : 'batch-a'
  const answers = normalizeQuizAnswers(applicant.quiz_answers)
  const quizDeparture = readDepartureFromQuiz(answers)
  const quizLabel =
    quizDeparture.state === 'selected'
      ? quizDeparture.label
      : resolveApplicantDepartureLabel(applicant.date_choice, batchSlug)

  const { data } = await supabase
    .from('batches')
    .select('spots_taken_m, spots_taken_f')
    .eq('slug', batchSlug)
    .maybeSingle()

  const vacantTotal =
    Math.max(0, 12 - (data?.spots_taken_m ?? 0)) + Math.max(0, 12 - (data?.spots_taken_f ?? 0))

  const urgency = await resolveDepartureUrgency(supabase, batchSlug, {
    quizLabel,
    dateChoice: applicant.date_choice,
    vacantTotal,
    batchLabel: BATCH_META[batchSlug].label,
  })

  return urgency.tier
}

export async function sendNurtureEmail(
  supabase: SupabaseClient,
  applicant: ApplicantNurtureRow,
  step: number,
  sequenceId?: string,
  sequenceKey: string = NURTURE_SEQUENCE_KEY_V2
): Promise<{ ok: boolean; skipped?: string; resendId?: string; tier?: DepartureUrgencyTier; ctx?: NurtureEmailContext }> {
  const maxStep = maxStepForSequenceKey(sequenceKey)
  if (step < 1 || step > maxStep) {
    return { ok: false, skipped: 'invalid_step' }
  }

  if (await isEmailUnsubscribed(supabase, applicant.email)) {
    await stopNurtureSequence(supabase, applicant.id, 'unsubscribed')
    return { ok: false, skipped: 'unsubscribed' }
  }

  const stopCheck = applicantShouldStopNurture(applicant)
  if (stopCheck.stop) {
    await stopNurtureSequence(supabase, applicant.id, stopCheck.reason ?? 'paid')
    return { ok: false, skipped: stopCheck.reason ?? 'paid' }
  }

  let ctx: NurtureEmailContext | null
  try {
    ctx = await buildNurtureContext(supabase, applicant, step)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'context_build_failed'
    console.error('[nurture] buildNurtureContext failed', { email: applicant.email, message })
    await logEmailSend(supabase, {
      applicant_id: applicant.id,
      sequence_id: sequenceId ?? null,
      step,
      subject: `step-${step}-context-error`,
      failed_at: new Date().toISOString(),
      error: message,
    })
    return { ok: false, skipped: message }
  }

  if (!ctx) return { ok: false, skipped: 'no_context' }

  const batchSlug = isMatchableBatch(applicant.batch_slug) ? applicant.batch_slug : 'batch-a'
  const urgency = await resolveDepartureUrgency(supabase, batchSlug, {
    quizLabel: ctx.departure.label,
    dateChoice: applicant.date_choice,
    vacantTotal: ctx.vacantTotal,
    batchLabel: ctx.batchLabel,
  })

  if (shouldStopAfterDepartureWindow(urgency) && sequenceId) {
    await stopNurtureSequence(supabase, applicant.id, 'manual')
    return { ok: false, skipped: 'departure_window_closed', tier: urgency.tier, ctx }
  }

  const content = renderNurtureEmail(step, ctx)

  if (!isResendConfigured() || !resend) {
    console.error('[nurture] RESEND_API_KEY not configured on server', {
      step,
      to: applicant.email,
    })
    await logEmailSend(supabase, {
      applicant_id: applicant.id,
      sequence_id: sequenceId ?? null,
      step,
      subject: content.subject,
      failed_at: new Date().toISOString(),
      error: 'resend_not_configured',
    })
    return { ok: false, skipped: 'resend_not_configured', tier: ctx.departure.tier, ctx }
  }

  try {
    const result = await resend.emails.send({
      from: 'Togetha.Club <hello@togetha.club>',
      to: applicant.email,
      subject: content.subject,
      text: content.text,
      html: content.html,
    })

    if (result.error) {
      const message = result.error.message ?? JSON.stringify(result.error)
      console.error('[nurture] resend API error', { step, email: applicant.email, message })
      await logEmailSend(supabase, {
        applicant_id: applicant.id,
        sequence_id: sequenceId ?? null,
        step,
        subject: content.subject,
        failed_at: new Date().toISOString(),
        error: message,
      })
      return { ok: false, skipped: message, tier: ctx.departure.tier, ctx }
    }

    await logEmailSend(supabase, {
      applicant_id: applicant.id,
      sequence_id: sequenceId ?? null,
      step,
      resend_message_id: result.data?.id ?? null,
      subject: content.subject,
    })

    console.info('[nurture] email sent', {
      step,
      email: applicant.email,
      resendId: result.data?.id,
      tier: ctx.departure.tier,
      sequenceKey,
    })

    return { ok: true, resendId: result.data?.id, tier: ctx.departure.tier, ctx }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'send_failed'
    console.error('[nurture] send failed', { step, email: applicant.email, message })
    await logEmailSend(supabase, {
      applicant_id: applicant.id,
      sequence_id: sequenceId ?? null,
      step,
      subject: content.subject,
      failed_at: new Date().toISOString(),
      error: message,
    })
    return { ok: false, skipped: message, tier: ctx.departure.tier, ctx }
  }
}

export async function enrollQuizNurture(
  supabase: SupabaseClient,
  applicantId: string
): Promise<NurtureEnrollResult> {
  const { data: applicant, error } = await supabase
    .from('applicants')
    .select('id, email, name, batch_slug, quiz_answers, quiz_score, date_choice, razorpay_payment_id, status')
    .eq('id', applicantId)
    .single()

  if (error || !applicant) {
    logSupabaseError('applicant fetch', error)
    return { ok: false, error: error?.message ?? 'applicant_not_found' }
  }

  if (applicantShouldStopNurture(applicant).stop) {
    return { ok: false, error: 'already_paid' }
  }

  if (await isEmailUnsubscribed(supabase, applicant.email)) {
    return { ok: false, error: 'unsubscribed' }
  }

  const enrolledAt = new Date()

  for (const key of NURTURE_SEQUENCE_KEYS) {
    const { error: deleteError } = await supabase
      .from('email_sequences')
      .delete()
      .eq('applicant_id', applicantId)
      .eq('sequence_key', key)
    logSupabaseError('email_sequences delete', deleteError)
  }

  const { data: sequence, error: seqError } = await supabase
    .from('email_sequences')
    .insert({
      applicant_id: applicantId,
      sequence_key: NURTURE_SEQUENCE_KEY,
      status: 'active',
      current_step: 0,
      enrolled_at: enrolledAt.toISOString(),
      next_send_at: null,
    })
    .select('id')
    .single()

  if (seqError || !sequence) {
    if (isMissingNurtureTable(seqError)) {
      console.error('[nurture] tables missing — run migration 023')
      return { ok: false, error: 'tables_missing' }
    }
    logSupabaseError('email_sequences insert', seqError)
    return { ok: false, error: seqError?.message ?? 'sequence_insert_failed' }
  }

  const sendResult = await sendNurtureEmail(
    supabase,
    applicant as ApplicantNurtureRow,
    1,
    sequence.id,
    NURTURE_SEQUENCE_KEY
  )

  if (!sendResult.ok) {
    await supabase
      .from('email_sequences')
      .update({
        status: 'stopped',
        stop_reason: 'error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', sequence.id)
    return {
      ok: false,
      error: sendResult.skipped ?? 'send_failed',
      emailSent: false,
    }
  }

  const tier = sendResult.tier ?? (await resolveTierForApplicant(supabase, applicant as ApplicantNurtureRow))

  const { error: updateError } = await supabase
    .from('email_sequences')
    .update({
      current_step: 1,
      next_send_at: nextSendAt(enrolledAt, 1, NURTURE_SEQUENCE_KEY, tier)?.toISOString() ?? null,
    })
    .eq('id', sequence.id)
  logSupabaseError('email_sequences update', updateError)

  return {
    ok: true,
    emailSent: true,
    resendId: sendResult.resendId,
  }
}

async function pullForwardUrgentSequences(supabase: SupabaseClient): Promise<number> {
  const now = new Date()
  const { data: active } = await supabase
    .from('email_sequences')
    .select('id, applicant_id, current_step, enrolled_at, next_send_at, sequence_key')
    .eq('status', 'active')
    .eq('sequence_key', NURTURE_SEQUENCE_KEY_V2)
    .not('next_send_at', 'is', null)
    .gt('next_send_at', now.toISOString())

  let updated = 0

  for (const row of active ?? []) {
    const { data: applicant } = await supabase
      .from('applicants')
      .select('id, email, name, batch_slug, quiz_answers, quiz_score, date_choice, razorpay_payment_id, status')
      .eq('id', row.applicant_id)
      .single()

    if (!applicant) continue

    const tier = await resolveTierForApplicant(supabase, applicant as ApplicantNurtureRow)
    if (tier !== 'critical' && tier !== 'urgent') continue

    const pulled = maybePullForwardSendAt(
      row.next_send_at,
      new Date(row.enrolled_at),
      row.current_step,
      row.sequence_key,
      tier,
      now
    )

    if (pulled && pulled.toISOString() !== row.next_send_at) {
      await supabase
        .from('email_sequences')
        .update({ next_send_at: pulled.toISOString() })
        .eq('id', row.id)
      updated += 1
    }
  }

  return updated
}

async function processSequenceBatch(
  supabase: SupabaseClient,
  sequenceKey: string
): Promise<{ processed: number; sent: number; errors: number }> {
  const now = new Date().toISOString()
  const maxStep = maxStepForSequenceKey(sequenceKey)

  const { data: due, error } = await supabase
    .from('email_sequences')
    .select('id, applicant_id, current_step, enrolled_at, next_send_at, sequence_key')
    .eq('status', 'active')
    .eq('sequence_key', sequenceKey)
    .lte('next_send_at', now)
    .lt('current_step', maxStep)

  if (error) {
    if (isMissingNurtureTable(error)) {
      console.warn('[nurture cron] tables missing')
      return { processed: 0, sent: 0, errors: 0 }
    }
    throw error
  }

  let processed = 0
  let sent = 0
  let errors = 0

  for (const row of due ?? []) {
    let currentStep = row.current_step
    const enrolledAt = new Date(row.enrolled_at)

    const { data: applicant } = await supabase
      .from('applicants')
      .select('id, email, name, batch_slug, quiz_answers, quiz_score, date_choice, razorpay_payment_id, status')
      .eq('id', row.applicant_id)
      .single()

    if (!applicant) continue

    processed += 1
    const nowDate = new Date()

    while (currentStep < maxStep) {
      const nextStep = currentStep + 1
      const tier = await resolveTierForApplicant(supabase, applicant as ApplicantNurtureRow)
      const scheduled =
        currentStep === row.current_step && row.next_send_at
          ? new Date(row.next_send_at)
          : nextSendAt(enrolledAt, currentStep, sequenceKey, tier)

      if (scheduled && scheduled > nowDate) {
        await supabase
          .from('email_sequences')
          .update({
            current_step: currentStep,
            next_send_at: scheduled.toISOString(),
          })
          .eq('id', row.id)
        break
      }

      const result = await sendNurtureEmail(
        supabase,
        applicant as ApplicantNurtureRow,
        nextStep,
        row.id,
        sequenceKey
      )

      if (result.ok) {
        sent += 1
        currentStep = nextStep
        const resultTier = result.tier ?? tier

        if (currentStep >= maxStep) {
          await supabase
            .from('email_sequences')
            .update({
              current_step: maxStep,
              status: 'completed',
              completed_at: new Date().toISOString(),
              next_send_at: null,
            })
            .eq('id', row.id)
          break
        }

        const nextDue = nextSendAt(enrolledAt, currentStep, sequenceKey, resultTier)
        if (!nextDue || nextDue > nowDate) {
          await supabase
            .from('email_sequences')
            .update({
              current_step: currentStep,
              next_send_at: nextDue?.toISOString() ?? null,
            })
            .eq('id', row.id)
          break
        }

        continue
      }

      if (result.skipped === 'departure_window_closed') {
        await supabase
          .from('email_sequences')
          .update({
            status: 'stopped',
            stop_reason: 'manual',
            completed_at: new Date().toISOString(),
            next_send_at: null,
          })
          .eq('id', row.id)
      } else {
        errors += 1
      }
      break
    }
  }

  return { processed, sent, errors }
}

export async function processDueNurtureEmails(
  supabase: SupabaseClient
): Promise<{ processed: number; sent: number; errors: number; pulledForward: number }> {
  const pulledForward = await pullForwardUrgentSequences(supabase)

  let processed = 0
  let sent = 0
  let errors = 0

  for (const key of NURTURE_SEQUENCE_KEYS) {
    const batch = await processSequenceBatch(supabase, key)
    processed += batch.processed
    sent += batch.sent
    errors += batch.errors
  }

  return { processed, sent, errors, pulledForward }
}
