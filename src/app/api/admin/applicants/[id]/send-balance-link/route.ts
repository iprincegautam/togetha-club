import { NextResponse } from 'next/server'
import {
  buildPreviewResponse,
  loadApplicantForBalance,
} from '@/lib/admin-balance-link'
import { normalizeApplicantIdOrEmail } from '@/lib/admin-applicant-lookup'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { assertBookingAmountsForEmail } from '@/lib/applicant-booking-amounts'
import { canAdminSendBalanceReminder } from '@/lib/applicant-kyc'
import { sendBalancePaymentReminderEmail } from '@/lib/resend'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id: rawId } = await params
  const id = normalizeApplicantIdOrEmail(rawId)

  if (id.includes('/')) {
    return NextResponse.json(
      {
        error:
          'Invalid applicant id in URL (contains /). Use /api/admin/applicants/send-balance-link?email=... instead.',
        received: rawId,
        example:
          '/api/admin/applicants/send-balance-link?email=techhitech11@gmail.com',
      },
      { status: 400 }
    )
  }

  const loaded = await loadApplicantForBalance(auth, id)
  if ('error' in loaded) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status })
  }

  return NextResponse.json(buildPreviewResponse(loaded))
}

export async function POST(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id: rawId } = await params
  const id = normalizeApplicantIdOrEmail(rawId)

  if (id.includes('/')) {
    return NextResponse.json(
      {
        error:
          'Invalid applicant id in URL. Use /api/admin/applicants/send-balance-link?email=... instead.',
      },
      { status: 400 }
    )
  }

  const loaded = await loadApplicantForBalance(auth, id)
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
