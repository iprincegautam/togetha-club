import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import {
  assertBookingAmountsForEmail,
  bookingAmountsFromApplicant,
} from '@/lib/applicant-booking-amounts'
import { listApplicantPayments, memberBalancePayUrl, summarizeApplicantPayments } from '@/lib/applicant-payments'
import { buildBalancePaymentReminder } from '@/lib/balance-payment-email'
import { getBatchDateOptions } from '@/constants/batches'
import { sendBalancePaymentReminderEmail } from '@/lib/resend'
import { formatPaise } from '@/lib/utils'
import { canAdminSendBalanceReminder } from '@/lib/applicant-kyc'
import {
  APPLICANT_SELECT_FOR_BALANCE,
  findApplicantByIdOrEmail,
  normalizeApplicantIdOrEmail,
} from '@/lib/admin-applicant-lookup'

export async function loadApplicantForBalance(
  auth: Awaited<ReturnType<typeof requireAdminApiAccess>>,
  idOrEmail: string
) {
  if ('error' in auth) return { error: auth.error, status: auth.status as number }

  const resolved = await findApplicantByIdOrEmail(auth.service, idOrEmail)
  if (!resolved) {
    return {
      error:
        'Applicant not found. Use their UUID from admin, or ?email=address@example.com — not {email} in the URL path.',
      status: 404 as number,
    }
  }

  const { data: applicant, error } = await auth.service
    .from('applicants')
    .select(APPLICANT_SELECT_FOR_BALANCE)
    .eq('id', resolved.id)
    .maybeSingle()

  if (error || !applicant) {
    return { error: 'Applicant not found', status: 404 as number }
  }

  const payments = await listApplicantPayments(auth.service, resolved.id)
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

export function buildPreviewResponse(loaded: Awaited<ReturnType<typeof loadApplicantForBalance>>) {
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
        ? 'Approve profile in admin before sending a balance reminder.'
        : null,
    payUrl,
    adminPageUrl: `/admin/applicants/${applicantId}`,
    emailPreview: {
      subject: emailPreview.subject,
      text: emailPreview.text,
    },
  }
}

/** Safe lookup: /api/admin/applicants/send-balance-link?email=user@example.com */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const email = request.nextUrl.searchParams.get('email')?.trim()
  const id = request.nextUrl.searchParams.get('id')?.trim()
  const key = email || id

  if (!key) {
    return NextResponse.json(
      {
        error:
          'Pass ?email=member@example.com or ?id=<applicant-uuid>. Do not put email in the URL path.',
        example:
          '/api/admin/applicants/send-balance-link?email=techhitech11@gmail.com',
      },
      { status: 400 }
    )
  }

  const loaded = await loadApplicantForBalance(auth, key)
  if ('error' in loaded) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status })
  }

  const body = buildPreviewResponse(loaded)
  return NextResponse.json(body)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const email = request.nextUrl.searchParams.get('email')?.trim()
  const id = request.nextUrl.searchParams.get('id')?.trim()
  let key = email || id

  if (!key) {
    try {
      const body = await request.json().catch(() => ({}))
      key = String(body.email ?? body.id ?? '').trim()
    } catch {
      key = ''
    }
  }

  if (!key) {
    return NextResponse.json({ error: 'Pass ?email= or ?id= query param' }, { status: 400 })
  }

  const loaded = await loadApplicantForBalance(auth, key)
  if ('error' in loaded) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status })
  }

  const { applicant, amounts, batchName, departureLabel, payUrl } = loaded

  if (!canAdminSendBalanceReminder(applicant)) {
    return NextResponse.json(
      {
        error:
          applicant.kyc_status !== 'approved'
            ? 'Approve profile before sending a balance payment reminder.'
            : 'Balance reminder is only for deposit bookings with an outstanding balance.',
        payUrl,
      },
      { status: 400 }
    )
  }

  if (applicant.status !== 'deposit_paid') {
    return NextResponse.json(
      { error: 'Balance reminder is only for deposit bookings with an outstanding balance' },
      { status: 400 }
    )
  }

  const validation = assertBookingAmountsForEmail(amounts)
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error, payUrl }, { status: 400 })
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
    return NextResponse.json(
      { error: emailResult.error, payUrl },
      { status: emailResult.error.includes('not configured') ? 503 : 502 }
    )
  }

  return NextResponse.json({
    ok: true,
    email: applicant.email,
    payUrl,
    balanceDue: amounts.balanceDuePaise,
    amounts: {
      paid: amounts.amountPaidPaise,
      final: amounts.finalAmountPaise,
      balance: amounts.balanceDuePaise,
    },
  })
}
