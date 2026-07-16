import type { SupabaseClient } from '@supabase/supabase-js'
import { BUSINESS } from '@/config/business'
import { sendApplicantBalanceLink } from '@/lib/applicant-ops/send-balance-link'
import { sendSlotReleasedEmail } from '@/lib/resend'

/** Wall-clock budget so the cron always returns before Vercel's 60s function cap. */
export const BALANCE_DEADLINE_TIME_BUDGET_MS = 50_000

/** Send the "pay soon" reminder once, when this many hours (or fewer) remain. */
const REMINDER_LEAD_HOURS = Math.max(1, Math.floor(BUSINESS.balancePaymentWindowHours / 2))

const RELEASE_SELECT =
  'id, email, name, status, kyc_status, balance_due, amount_paid, batch_slug, gender, admin_notes, balance_deadline_at, balance_reminder_sent_at, batches ( name )'

type DeadlineRow = {
  id: string
  email: string
  name: string | null
  status: string
  kyc_status: string | null
  balance_due: number | null
  amount_paid: number | null
  batch_slug: string | null
  gender: string | null
  admin_notes: string | null
  balance_deadline_at: string | null
  balance_reminder_sent_at: string | null
  batches: { name: string | null } | { name: string | null }[] | null
}

function batchNameOf(row: DeadlineRow): string {
  const b = Array.isArray(row.batches) ? row.batches[0] : row.batches
  return b?.name ?? row.batch_slug ?? 'your Togetha trip'
}

/** Free the seat on the batch (mirrors the increment done at payment time). */
async function decrementBatchSpot(service: SupabaseClient, row: DeadlineRow): Promise<void> {
  if (!row.batch_slug || (row.gender !== 'm' && row.gender !== 'f')) return
  const spotField = row.gender === 'm' ? 'spots_taken_m' : 'spots_taken_f'
  const { data: batchRow } = await service
    .from('batches')
    .select(spotField)
    .eq('slug', row.batch_slug)
    .single()
  if (!batchRow) return
  const current = (batchRow as Record<string, number>)[spotField] ?? 0
  await service
    .from('batches')
    .update({ [spotField]: Math.max(0, current - 1) })
    .eq('slug', row.batch_slug)
}

export type BalanceDeadlineResult = {
  remindersSent: number
  released: number
  errors: number
  remaining: number
}

/**
 * Enforce the balance payment deadline for approved deposit bookings:
 *   1. Send a one-time reminder when the deadline is near.
 *   2. Release the slot (status -> 'expired') once the deadline passes, free the
 *      seat, flag ops for the partial refund, and email the member.
 *
 * Only rows with a non-null balance_deadline_at are considered, so bookings
 * approved before this feature shipped are never auto-released.
 */
export async function processBalanceDeadlines(
  service: SupabaseClient,
  opts: { now?: Date; timeBudgetMs?: number } = {}
): Promise<BalanceDeadlineResult> {
  const now = opts.now ?? new Date()
  const deadline = Date.now() + (opts.timeBudgetMs ?? BALANCE_DEADLINE_TIME_BUDGET_MS)
  const nowIso = now.toISOString()
  const forfeitPercent = BUSINESS.lateForfeitPercent

  const result: BalanceDeadlineResult = {
    remindersSent: 0,
    released: 0,
    errors: 0,
    remaining: 0,
  }

  // --- 1. Releases: deadline already passed ---
  const { data: dueRows, error: dueError } = await service
    .from('applicants')
    .select(RELEASE_SELECT)
    .eq('status', 'deposit_paid')
    .eq('kyc_status', 'approved')
    .gt('balance_due', 0)
    .not('balance_deadline_at', 'is', null)
    .lte('balance_deadline_at', nowIso)
    .order('balance_deadline_at', { ascending: true })
    .limit(200)

  if (dueError) {
    console.error('[processBalanceDeadlines] release query', dueError)
    result.errors += 1
  }

  for (const row of (dueRows ?? []) as DeadlineRow[]) {
    if (Date.now() > deadline) {
      result.remaining += 1
      continue
    }
    try {
      const amountPaid = Math.max(0, row.amount_paid ?? 0)
      const refundPaise = Math.round((amountPaid * (100 - forfeitPercent)) / 100)
      const retainedPaise = Math.max(0, amountPaid - refundPaise)
      const batchName = batchNameOf(row)

      const note = `[auto-release ${nowIso}] Balance deadline missed. Slot released; refund ${(
        refundPaise / 100
      ).toFixed(0)} INR (${100 - forfeitPercent}% of paid) pending — process manually in Razorpay.`
      const adminNotes = row.admin_notes ? `${row.admin_notes}\n${note}` : note

      const { error: updateError } = await service
        .from('applicants')
        .update({
          status: 'expired',
          slot_released_at: nowIso,
          admin_notes: adminNotes,
        })
        .eq('id', row.id)
        .eq('status', 'deposit_paid') // guard against a race with a just-completed payment

      if (updateError) {
        console.error('[processBalanceDeadlines] release update', row.id, updateError)
        result.errors += 1
        continue
      }

      await decrementBatchSpot(service, row)

      try {
        await sendSlotReleasedEmail({
          to: row.email,
          name: row.name || 'there',
          batchName,
          amountPaidPaise: amountPaid,
          refundPaise,
          retainedPaise,
          forfeitPercent,
        })
      } catch (err) {
        console.warn('[processBalanceDeadlines] release email failed', row.id, err)
      }

      result.released += 1
    } catch (err) {
      console.error('[processBalanceDeadlines] release row', row.id, err)
      result.errors += 1
    }
  }

  // --- 2. Reminders: deadline approaching, not yet reminded ---
  const leadIso = new Date(
    now.getTime() + REMINDER_LEAD_HOURS * 60 * 60 * 1000
  ).toISOString()

  const { data: soonRows, error: soonError } = await service
    .from('applicants')
    .select('id, balance_deadline_at')
    .eq('status', 'deposit_paid')
    .eq('kyc_status', 'approved')
    .gt('balance_due', 0)
    .is('balance_reminder_sent_at', null)
    .not('balance_deadline_at', 'is', null)
    .gt('balance_deadline_at', nowIso)
    .lte('balance_deadline_at', leadIso)
    .order('balance_deadline_at', { ascending: true })
    .limit(200)

  if (soonError) {
    console.error('[processBalanceDeadlines] reminder query', soonError)
    result.errors += 1
  }

  for (const row of (soonRows ?? []) as { id: string }[]) {
    if (Date.now() > deadline) {
      result.remaining += 1
      continue
    }
    try {
      const emailResult = await sendApplicantBalanceLink(service, row.id)
      // Mark as reminded regardless of delivery success to avoid retry storms;
      // ops can still resend manually from the payments panel.
      await service
        .from('applicants')
        .update({ balance_reminder_sent_at: nowIso })
        .eq('id', row.id)

      if (emailResult.ok) {
        result.remindersSent += 1
      } else {
        console.warn('[processBalanceDeadlines] reminder not sent', row.id, emailResult.error)
      }
    } catch (err) {
      console.error('[processBalanceDeadlines] reminder row', row.id, err)
      result.errors += 1
    }
  }

  return result
}
