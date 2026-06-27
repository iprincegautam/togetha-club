import type { SupabaseClient } from '@supabase/supabase-js'
import {
  assertBookingAmountsForEmail,
  bookingAmountsFromApplicant,
} from '@/lib/applicant-booking-amounts'
import { listApplicantPayments, memberBalancePayUrl, summarizeApplicantPayments } from '@/lib/applicant-payments'
import { buildBalancePaymentReminder } from '@/lib/balance-payment-email'
import { getBatchDateOptions } from '@/constants/batches'
import { canAdminSendBalanceReminder } from '@/lib/applicant-kyc'
import {
  APPLICANT_SELECT_FOR_BALANCE,
  findApplicantByIdOrEmail,
} from '@/lib/admin-applicant-lookup'
import { sendBalancePaymentReminderEmail } from '@/lib/resend'
import { formatPaise } from '@/lib/utils'

export async function loadApplicantForBalance(service: SupabaseClient, idOrEmail: string) {
  const resolved = await findApplicantByIdOrEmail(service, idOrEmail)
  if (!resolved) {
    return {
      error:
        'Applicant not found. Use their UUID from admin, or ?email=address@example.com — not {email} in the URL path.',
      status: 404 as number,
    }
  }

  const { data: applicant, error } = await service
    .from('applicants')
    .select(APPLICANT_SELECT_FOR_BALANCE)
    .eq('id', resolved.id)
    .maybeSingle()

  if (error || !applicant) {
    return { error: 'Applicant not found', status: 404 as number }
  }

  const payments = await listApplicantPayments(service, resolved.id)
  const ledgerTotal = summarizeApplicantPayments(payments).totalPaidPaise
  const amounts = bookingAmountsFromApplicant(applicant, ledgerTotal)

  const batch = Array.isArray(applicant.batches) ? applicant.batches[0] : applicant.batches
  const batchName = batch?.name ?? applicant.batch_slug ?? 'your Togetha trip'
  const slug = applicant.batch_slug ?? ''
  const dateIndex = applicant.date_choice ? Number(applicant.date_choice) : null
  const dateOptions = getBatchDateOptions(slug)
  const departureLabel =
    dateIndex !== null && !Number.isNaN(dateIndex)
      ? dateOptions[dateIndex]?.label ?? applicant.date_choice
      : applicant.date_choice

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://togetha.club'
  const payUrl = memberBalancePayUrl(siteUrl)

  return { applicant, amounts, batchName, departureLabel, payUrl, siteUrl, applicantId: resolved.id }
}

export function buildBalanceLinkPreview(loaded: Awaited<ReturnType<typeof loadApplicantForBalance>>) {
  if ('error' in loaded) return null

  const { applicant, amounts, batchName, departureLabel, payUrl, siteUrl, applicantId } = loaded
  const validation = assertBookingAmountsForEmail(amounts)
  const emailPreview = buildBalancePaymentReminder({
    name: applicant.name || 'there',
    batchName,
    balanceDuePaise: amounts.balanceDuePaise,
    amountPaidPaise: amounts.amountPaidPaise,
    finalAmountPaise: amounts.finalAmountPaise,
    originalAmountPaise: amounts.originalAmountPaise,
    discountAmountPaise: amounts.discountAmountPaise,
    departureLabel,
    siteUrl,
  })

  return {
    applicantId,
    applicant: {
      email: applicant.email,
      name: applicant.name,
      status: applicant.status,
      paymentPlan: applicant.payment_plan,
    },
    amounts: {
      original: amounts.originalAmountPaise,
      final: amounts.finalAmountPaise,
      discount: amounts.discountAmountPaise,
      paid: amounts.amountPaidPaise,
      balance: amounts.balanceDuePaise,
      ledgerTotalPaid: amounts.ledgerTotalPaidPaise,
      isConsistent: amounts.isConsistent,
      formatted: {
        original: amounts.originalAmountPaise != null ? formatPaise(amounts.originalAmountPaise) : null,
        final: amounts.finalAmountPaise != null ? formatPaise(amounts.finalAmountPaise) : null,
        discount:
          amounts.discountAmountPaise != null ? formatPaise(amounts.discountAmountPaise) : null,
        paid: formatPaise(amounts.amountPaidPaise),
        balance: formatPaise(amounts.balanceDuePaise),
      },
    },
    canSend:
      canAdminSendBalanceReminder(applicant) && validation.ok && amounts.balanceDuePaise > 0,
    profileKycApproved: applicant.kyc_status === 'approved',
    validationError: !validation.ok
      ? validation.error
      : applicant.kyc_status !== 'approved'
        ? 'Approve profile before sending a balance reminder.'
        : null,
    payUrl,
    emailPreview: {
      subject: emailPreview.subject,
      text: emailPreview.text,
    },
  }
}

export async function sendApplicantBalanceLink(service: SupabaseClient, idOrEmail: string) {
  const loaded = await loadApplicantForBalance(service, idOrEmail)
  if ('error' in loaded) {
    return { ok: false as const, error: loaded.error, status: loaded.status, payUrl: undefined }
  }

  const { applicant, amounts, batchName, departureLabel, payUrl } = loaded

  if (!canAdminSendBalanceReminder(applicant)) {
    return {
      ok: false as const,
      error:
        applicant.kyc_status !== 'approved'
          ? 'Approve profile before sending a balance payment reminder.'
          : 'Balance reminder is only for deposit bookings with an outstanding balance.',
      status: 400,
      payUrl,
    }
  }

  if (applicant.status !== 'deposit_paid') {
    return {
      ok: false as const,
      error: 'Balance reminder is only for deposit bookings with an outstanding balance',
      status: 400,
      payUrl,
    }
  }

  const validation = assertBookingAmountsForEmail(amounts)
  if (!validation.ok) {
    return { ok: false as const, error: validation.error, status: 400, payUrl }
  }

  const emailResult = await sendBalancePaymentReminderEmail({
    to: applicant.email,
    name: applicant.name || 'there',
    batchName,
    balanceDuePaise: amounts.balanceDuePaise,
    amountPaidPaise: amounts.amountPaidPaise,
    finalAmountPaise: amounts.finalAmountPaise,
    originalAmountPaise: amounts.originalAmountPaise,
    discountAmountPaise: amounts.discountAmountPaise,
    departureLabel,
  })

  if (!emailResult.ok) {
    return {
      ok: false as const,
      error: emailResult.error,
      status: emailResult.error.includes('not configured') ? 503 : 502,
      payUrl,
    }
  }

  return {
    ok: true as const,
    email: applicant.email,
    payUrl,
    balanceDue: amounts.balanceDuePaise,
    amounts: {
      paid: amounts.amountPaidPaise,
      final: amounts.finalAmountPaise,
      balance: amounts.balanceDuePaise,
    },
  }
}
