import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { memberBalancePayUrl } from '@/lib/applicant-payments'
import { getBatchDateOptions } from '@/constants/batches'
import { sendBalancePaymentReminderEmail } from '@/lib/resend'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const { data: applicant, error } = await auth.service
    .from('applicants')
    .select(
      `
      id, email, name, status, balance_due, amount_paid, final_amount,
      date_choice, batch_slug,
      batches ( name )
    `
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !applicant) {
    return NextResponse.json({ error: 'Applicant not found' }, { status: 404 })
  }

  const balanceDue = applicant.balance_due ?? 0
  if (balanceDue <= 0) {
    return NextResponse.json({ error: 'No balance due on this booking' }, { status: 400 })
  }

  if (applicant.status !== 'deposit_paid') {
    return NextResponse.json(
      { error: 'Balance reminder is only for deposit bookings with an outstanding balance' },
      { status: 400 }
    )
  }

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

  const emailResult = await sendBalancePaymentReminderEmail({
    to: applicant.email,
    name: applicant.name || 'there',
    batchName,
    balanceDuePaise: balanceDue,
    amountPaidPaise: applicant.amount_paid ?? 0,
    finalAmountPaise: applicant.final_amount,
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
    balanceDue,
  })
}
