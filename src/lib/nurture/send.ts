import { isResendConfigured, resend } from '@/lib/resend'
import {
  buildNurtureContext,
  type ApplicantNurtureRow,
} from '@/lib/nurture/context'
import { nextSendAt } from '@/lib/nurture/schedule'
import {
  applicantShouldStopNurture,
  isEmailUnsubscribed,
  stopNurtureSequence,
} from '@/lib/nurture/should-stop'
import { renderNurtureEmail } from '@/lib/nurture/templates'
import type { SupabaseClient } from '@supabase/supabase-js'

function isMissingNurtureTable(error: { message?: string } | null): boolean {
  const msg = error?.message ?? ''
  return msg.includes('email_sequences') || msg.includes('email_sends') || msg.includes('does not exist')
}

export async function sendNurtureEmail(
  supabase: SupabaseClient,
  applicant: ApplicantNurtureRow,
  step: number,
  sequenceId?: string
): Promise<{ ok: boolean; skipped?: string; resendId?: string }> {
  if (step < 1 || step > 5) {
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

  const ctx = await buildNurtureContext(supabase, applicant, step)
  if (!ctx) return { ok: false, skipped: 'no_context' }

  const content = renderNurtureEmail(step, ctx)

  if (!isResendConfigured() || !resend) {
    console.warn('[nurture] RESEND_API_KEY not configured — email not sent', {
      step,
      to: applicant.email,
    })
    await supabase.from('email_sends').insert({
      applicant_id: applicant.id,
      sequence_id: sequenceId ?? null,
      step,
      subject: content.subject,
      failed_at: new Date().toISOString(),
      error: 'resend_not_configured',
    })
    return { ok: false, skipped: 'resend_not_configured' }
  }

  try {
    const result = await resend.emails.send({
      from: 'Togetha.Club <hello@togetha.club>',
      to: applicant.email,
      subject: content.subject,
      text: content.text,
      html: content.html,
      replyTo: 'hello@togetha.club',
    })

    await supabase.from('email_sends').insert({
      applicant_id: applicant.id,
      sequence_id: sequenceId ?? null,
      step,
      resend_message_id: result.data?.id ?? null,
      subject: content.subject,
    })

    return { ok: true, resendId: result.data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'send_failed'
    console.error('[nurture] send failed', { step, email: applicant.email, message })
    await supabase.from('email_sends').insert({
      applicant_id: applicant.id,
      sequence_id: sequenceId ?? null,
      step,
      subject: content.subject,
      failed_at: new Date().toISOString(),
      error: message,
    })
    return { ok: false, skipped: message }
  }
}

export async function enrollQuizNurture(
  supabase: SupabaseClient,
  applicantId: string
): Promise<{ ok: boolean; error?: string }> {
  const { data: applicant, error } = await supabase
    .from('applicants')
    .select('id, email, name, batch_slug, quiz_answers, quiz_score, date_choice, razorpay_payment_id, status')
    .eq('id', applicantId)
    .single()

  if (error || !applicant) {
    return { ok: false, error: error?.message ?? 'applicant_not_found' }
  }

  if (applicantShouldStopNurture(applicant).stop) {
    return { ok: false, error: 'already_paid' }
  }

  if (await isEmailUnsubscribed(supabase, applicant.email)) {
    return { ok: false, error: 'unsubscribed' }
  }

  const enrolledAt = new Date()

  await supabase
    .from('email_sequences')
    .delete()
    .eq('applicant_id', applicantId)
    .eq('sequence_key', 'quiz_nurture_v1')

  const { data: sequence, error: seqError } = await supabase
    .from('email_sequences')
    .insert({
      applicant_id: applicantId,
      sequence_key: 'quiz_nurture_v1',
      status: 'active',
      current_step: 0,
      enrolled_at: enrolledAt.toISOString(),
      next_send_at: null,
    })
    .select('id')
    .single()

  if (seqError) {
    if (isMissingNurtureTable(seqError)) {
      console.warn('[nurture] tables missing — run migration 023')
      return { ok: false, error: 'tables_missing' }
    }
    return { ok: false, error: seqError.message }
  }

  const sendResult = await sendNurtureEmail(
    supabase,
    applicant as ApplicantNurtureRow,
    1,
    sequence.id
  )

  if (!sendResult.ok && sendResult.skipped !== 'resend_not_configured') {
    await supabase
      .from('email_sequences')
      .update({ status: 'stopped', stop_reason: 'error', completed_at: new Date().toISOString() })
      .eq('id', sequence.id)
    return { ok: false, error: sendResult.skipped }
  }

  await supabase
    .from('email_sequences')
    .update({
      current_step: 1,
      next_send_at: nextSendAt(enrolledAt, 1)?.toISOString() ?? null,
    })
    .eq('id', sequence.id)

  return { ok: true }
}

export async function processDueNurtureEmails(
  supabase: SupabaseClient
): Promise<{ processed: number; sent: number; errors: number }> {
  const now = new Date().toISOString()

  const { data: due, error } = await supabase
    .from('email_sequences')
    .select('id, applicant_id, current_step, enrolled_at')
    .eq('status', 'active')
    .eq('sequence_key', 'quiz_nurture_v1')
    .lte('next_send_at', now)
    .lt('current_step', 5)

  if (error) {
    if (isMissingNurtureTable(error)) {
      console.warn('[nurture cron] tables missing')
      return { processed: 0, sent: 0, errors: 0 }
    }
    throw error
  }

  let sent = 0
  let errors = 0

  for (const row of due ?? []) {
    const nextStep = row.current_step + 1
    if (nextStep > 5) continue

    const { data: applicant } = await supabase
      .from('applicants')
      .select('id, email, name, batch_slug, quiz_answers, quiz_score, date_choice, razorpay_payment_id, status')
      .eq('id', row.applicant_id)
      .single()

    if (!applicant) continue

    const result = await sendNurtureEmail(
      supabase,
      applicant as ApplicantNurtureRow,
      nextStep,
      row.id
    )

    if (result.ok) {
      sent += 1
      const enrolledAt = new Date(row.enrolled_at)
      if (nextStep >= 5) {
        await supabase
          .from('email_sequences')
          .update({
            current_step: 5,
            status: 'completed',
            completed_at: new Date().toISOString(),
            next_send_at: null,
          })
          .eq('id', row.id)
      } else {
        await supabase
          .from('email_sequences')
          .update({
            current_step: nextStep,
            next_send_at: nextSendAt(enrolledAt, nextStep)?.toISOString() ?? null,
          })
          .eq('id', row.id)
      }
    } else {
      errors += 1
      if (result.skipped === 'paid' || result.skipped === 'unsubscribed') {
        // sequence already stopped
      }
    }
  }

  return { processed: due?.length ?? 0, sent, errors }
}
