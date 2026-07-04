import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'
import { paymentKindLabel, type ApplicantPaymentKind } from '@/lib/applicant-payments'

/** Cash basis: only commissions actually paid out count as money out. */
const CASH_OUT_REDEMPTION_STATUSES = ['paid_out', 'paid']

export type FinanceTransaction = {
  id: string
  date: string
  source: 'payment' | 'commission' | 'cost'
  direction: 'in' | 'out'
  amountPaise: number
  label: string
  applicantId: string | null
  applicantName: string | null
  vendorName: string | null
  batchSlug: string | null
  departureId: string | null
  departureLabel: string | null
}

export type DepartureBreakdown = {
  departureId: string
  label: string
  departureDate: string | null
  status: string
  /** Booked trip value: SUM(applicants.final_amount) for confirmed bookings. */
  bookedPaise: number
  /** Cash actually received (applicant_payments ledger). */
  collectedPaise: number
  commissionsPaise: number
  operatingCostsPaise: number
  /** bookedPaise - commissions - operating costs. */
  grossProfitPaise: number
  costs: {
    id: string
    costType: string
    description: string | null
    vendorName: string | null
    amountPaise: number
    incurredOn: string | null
    createdAt: string
  }[]
}

export type BatchBreakdown = {
  batchSlug: string
  batchName: string
  bookedPaise: number
  collectedPaise: number
  commissionsPaise: number
  operatingCostsPaise: number
  grossProfitPaise: number
  /** Bookings in this batch not yet assigned to a departure. */
  unassignedBookedPaise: number
  unassignedCollectedPaise: number
  unassignedCommissionsPaise: number
  departures: DepartureBreakdown[]
}

type JoinedApplicant = {
  id?: string
  name: string | null
  email?: string | null
  batch_slug: string | null
  departure_id: string | null
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export async function GET(request: Request) {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { searchParams } = new URL(request.url)
  const batchFilter = searchParams.get('batch')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const s = auth.service
  const [paymentsRes, redemptionsRes, costsRes, bookingsRes, departuresRes, batchesRes] =
    await Promise.all([
      s
        .from('applicant_payments')
        .select(
          'id, applicant_id, amount_paise, payment_kind, captured_at, applicants (id, name, batch_slug, departure_id)'
        ),
      s
        .from('promo_redemptions')
        .select(
          'id, commission_amount, paid_at, created_at, applicant_id, influencers (name), applicants (id, name, batch_slug, departure_id)'
        )
        .in('status', CASH_OUT_REDEMPTION_STATUSES),
      s
        .from('departure_costs')
        .select('id, departure_id, cost_type, description, vendor_name, amount_paise, incurred_on, created_at'),
      // Confirmed bookings: verified Razorpay payment or paid/deposit_paid status.
      // final_amount is the trip price after discounts, saved at checkout.
      s
        .from('applicants')
        .select('id, batch_slug, departure_id, final_amount')
        .or('razorpay_payment_id.not.is.null,status.in.(paid,deposit_paid)'),
      s
        .from('batch_departures')
        .select('id, batch_slug, label, departure_date, status')
        .order('sort_order', { ascending: true }),
      s.from('batches').select('slug, name'),
    ])

  const firstError =
    paymentsRes.error ??
    redemptionsRes.error ??
    costsRes.error ??
    bookingsRes.error ??
    departuresRes.error ??
    batchesRes.error
  if (firstError) {
    console.error('[GET finance transactions]', firstError)
    return NextResponse.json({ error: firstError.message }, { status: 500 })
  }

  const departures = departuresRes.data ?? []
  const departureById = new Map(departures.map((d) => [d.id as string, d]))
  const batchNameBySlug = new Map(
    (batchesRes.data ?? []).map((b) => [b.slug as string, b.name as string])
  )

  const transactions: FinanceTransaction[] = []

  for (const p of paymentsRes.data ?? []) {
    const applicant = one(p.applicants) as JoinedApplicant | null
    const departure = applicant?.departure_id
      ? departureById.get(applicant.departure_id)
      : undefined
    transactions.push({
      id: `payment:${p.id}`,
      date: p.captured_at as string,
      source: 'payment',
      direction: 'in',
      amountPaise: p.amount_paise as number,
      label: paymentKindLabel(p.payment_kind as ApplicantPaymentKind),
      applicantId: (p.applicant_id as string) ?? null,
      applicantName: applicant?.name ?? null,
      vendorName: null,
      batchSlug: applicant?.batch_slug ?? null,
      departureId: applicant?.departure_id ?? null,
      departureLabel: (departure?.label as string) ?? null,
    })
  }

  for (const r of redemptionsRes.data ?? []) {
    const applicant = one(r.applicants) as JoinedApplicant | null
    const influencer = one(r.influencers) as { name: string | null } | null
    const departure = applicant?.departure_id
      ? departureById.get(applicant.departure_id)
      : undefined
    transactions.push({
      id: `commission:${r.id}`,
      date: (r.paid_at ?? r.created_at) as string,
      source: 'commission',
      direction: 'out',
      amountPaise: (r.commission_amount as number) ?? 0,
      label: `Commission — ${influencer?.name ?? 'partner'}`,
      applicantId: (r.applicant_id as string) ?? null,
      applicantName: applicant?.name ?? null,
      vendorName: influencer?.name ?? null,
      batchSlug: applicant?.batch_slug ?? null,
      departureId: applicant?.departure_id ?? null,
      departureLabel: (departure?.label as string) ?? null,
    })
  }

  for (const c of costsRes.data ?? []) {
    const departure = departureById.get(c.departure_id as string)
    transactions.push({
      id: `cost:${c.id}`,
      date: (c.incurred_on ?? c.created_at) as string,
      source: 'cost',
      direction: 'out',
      amountPaise: c.amount_paise as number,
      label: `${(c.cost_type as string).charAt(0).toUpperCase()}${(c.cost_type as string).slice(1)} cost${c.description ? ` — ${c.description}` : ''}`,
      applicantId: null,
      applicantName: null,
      vendorName: (c.vendor_name as string) ?? null,
      batchSlug: (departure?.batch_slug as string) ?? null,
      departureId: (c.departure_id as string) ?? null,
      departureLabel: (departure?.label as string) ?? null,
    })
  }

  const matchesBatch = (slug: string | null) => !batchFilter || slug === batchFilter
  const matchesFilters = (t: FinanceTransaction) => {
    if (!matchesBatch(t.batchSlug)) return false
    if (from && t.date.slice(0, 10) < from) return false
    if (to && t.date.slice(0, 10) > to) return false
    return true
  }

  const filtered = transactions
    .filter(matchesFilters)
    .sort((a, b) => b.date.localeCompare(a.date))

  const moneyInPaise = filtered
    .filter((t) => t.direction === 'in')
    .reduce((sum, t) => sum + t.amountPaise, 0)
  const commissionsOutPaise = filtered
    .filter((t) => t.source === 'commission')
    .reduce((sum, t) => sum + t.amountPaise, 0)
  const operatingCostsPaise = filtered
    .filter((t) => t.source === 'cost')
    .reduce((sum, t) => sum + t.amountPaise, 0)

  // ── Booked revenue (all-time, batch filter only — bookings aren't dated cash) ──
  const bookings = (bookingsRes.data ?? []).filter((b) => matchesBatch(b.batch_slug as string))
  const bookedRevenuePaise = bookings.reduce(
    (sum, b) => sum + ((b.final_amount as number) ?? 0),
    0
  )
  const collectedAllTimePaise = transactions
    .filter((t) => t.source === 'payment' && matchesBatch(t.batchSlug))
    .reduce((sum, t) => sum + t.amountPaise, 0)
  const outflowAllTimePaise = transactions
    .filter((t) => t.direction === 'out' && matchesBatch(t.batchSlug))
    .reduce((sum, t) => sum + t.amountPaise, 0)

  // ── Per-batch / per-departure breakdown (all-time, batch filter only) ──
  const breakdownMap = new Map<string, BatchBreakdown>()
  const ensureBatch = (slug: string | null): BatchBreakdown => {
    const key = slug ?? 'unknown'
    let entry = breakdownMap.get(key)
    if (!entry) {
      entry = {
        batchSlug: key,
        batchName: slug ? (batchNameBySlug.get(slug) ?? slug) : 'No batch',
        bookedPaise: 0,
        collectedPaise: 0,
        commissionsPaise: 0,
        operatingCostsPaise: 0,
        grossProfitPaise: 0,
        unassignedBookedPaise: 0,
        unassignedCollectedPaise: 0,
        unassignedCommissionsPaise: 0,
        departures: [],
      }
      breakdownMap.set(key, entry)
    }
    return entry
  }

  const departureBreakdownById = new Map<string, DepartureBreakdown>()
  for (const d of departures) {
    const entry: DepartureBreakdown = {
      departureId: d.id as string,
      label: d.label as string,
      departureDate: (d.departure_date as string) ?? null,
      status: d.status as string,
      bookedPaise: 0,
      collectedPaise: 0,
      commissionsPaise: 0,
      operatingCostsPaise: 0,
      grossProfitPaise: 0,
      costs: [],
    }
    departureBreakdownById.set(entry.departureId, entry)
    ensureBatch(d.batch_slug as string).departures.push(entry)
  }

  for (const b of bookingsRes.data ?? []) {
    const amount = (b.final_amount as number) ?? 0
    if (amount <= 0) continue
    const batch = ensureBatch(b.batch_slug as string)
    const departure = b.departure_id
      ? departureBreakdownById.get(b.departure_id as string)
      : undefined
    batch.bookedPaise += amount
    if (departure) departure.bookedPaise += amount
    else batch.unassignedBookedPaise += amount
  }

  for (const t of transactions) {
    const batch = ensureBatch(t.batchSlug)
    const departure = t.departureId ? departureBreakdownById.get(t.departureId) : undefined
    if (t.source === 'payment') {
      batch.collectedPaise += t.amountPaise
      if (departure) departure.collectedPaise += t.amountPaise
      else batch.unassignedCollectedPaise += t.amountPaise
    } else if (t.source === 'commission') {
      batch.commissionsPaise += t.amountPaise
      if (departure) departure.commissionsPaise += t.amountPaise
      else batch.unassignedCommissionsPaise += t.amountPaise
    } else {
      batch.operatingCostsPaise += t.amountPaise
      if (departure) departure.operatingCostsPaise += t.amountPaise
    }
  }

  for (const c of costsRes.data ?? []) {
    const departure = departureBreakdownById.get(c.departure_id as string)
    departure?.costs.push({
      id: c.id as string,
      costType: c.cost_type as string,
      description: (c.description as string) ?? null,
      vendorName: (c.vendor_name as string) ?? null,
      amountPaise: c.amount_paise as number,
      incurredOn: (c.incurred_on as string) ?? null,
      createdAt: c.created_at as string,
    })
  }

  for (const batch of breakdownMap.values()) {
    for (const d of batch.departures) {
      d.grossProfitPaise = d.bookedPaise - d.commissionsPaise - d.operatingCostsPaise
    }
    batch.grossProfitPaise =
      batch.bookedPaise - batch.commissionsPaise - batch.operatingCostsPaise
  }

  const breakdown = Array.from(breakdownMap.values())
    .filter((b) => matchesBatch(b.batchSlug))
    .filter(
      (b) =>
        b.departures.length > 0 ||
        b.bookedPaise > 0 ||
        b.collectedPaise > 0 ||
        b.commissionsPaise > 0 ||
        b.operatingCostsPaise > 0
    )
    .sort((a, b) => a.batchSlug.localeCompare(b.batchSlug))

  return NextResponse.json({
    transactions: filtered,
    summary: {
      /** Booked trip value (final price after discounts) across confirmed bookings. */
      bookedRevenuePaise,
      /** Cash received within the current filters. */
      moneyInPaise,
      /** Cash out within the current filters (commissions + operating costs). */
      moneyOutPaise: commissionsOutPaise + operatingCostsPaise,
      commissionsOutPaise,
      operatingCostsPaise,
      /** Booked minus cash collected (all-time, ledger-based). */
      outstandingPaise: bookedRevenuePaise - collectedAllTimePaise,
      collectedPaise: collectedAllTimePaise,
      /** Booked revenue minus all-time outflows. */
      grossProfitPaise: bookedRevenuePaise - outflowAllTimePaise,
      bookingCount: bookings.length,
    },
    breakdown,
    batches: (batchesRes.data ?? []).map((b) => ({ slug: b.slug, name: b.name })),
  })
}
