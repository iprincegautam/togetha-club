import type { SupabaseClient } from '@supabase/supabase-js'
import {
  maskTravelerName,
  monthKey,
  monthLabel,
} from '@/lib/partner-portal'
import { buildPartnerShareUrl } from '@/lib/partner-share'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://togetha.club'

type InfluencerRow = Record<string, unknown>

export async function buildPartnerMePayload(
  service: SupabaseClient,
  influencer: InfluencerRow,
  view?: string | null
) {
  const influencerId = influencer.id as string

  const { data: promos } = await service
    .from('promo_codes')
    .select('*')
    .eq('influencer_id', influencerId)
    .order('code')

  const { data: redemptions } = await service
    .from('promo_redemptions')
    .select(
      `
      id,
      discount_amount,
      commission_amount,
      status,
      paid_at,
      created_at,
      applicants ( name, email, batch_slug, departure_id ),
      promo_codes ( code )
    `
    )
    .eq('influencer_id', influencerId)
    .order('created_at', { ascending: false })

  const rows = redemptions ?? []
  const pending = rows.filter((r) => r.status === 'pending')
  const approved = rows.filter((r) => r.status === 'approved')
  const paidOut = rows.filter((r) => r.status === 'paid_out' || r.status === 'paid')

  const sum = (list: typeof rows) =>
    list.reduce((acc, r) => acc + (r.commission_amount ?? 0), 0)

  const monthlyMap = new Map<string, number>()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)

  for (const r of rows) {
    if (r.status === 'cancelled') continue
    const created = r.created_at as string
    if (new Date(created) < sixMonthsAgo) continue
    const key = monthKey(created)
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + (r.commission_amount ?? 0))
  }

  const monthlyCommissions = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, amountPaise]) => ({
      month: key,
      label: monthLabel(key),
      amountPaise,
    }))

  const mapRedemption = (r: (typeof rows)[0], includeDetail = false) => {
    const app = Array.isArray(r.applicants) ? r.applicants[0] : r.applicants
    const promo = Array.isArray(r.promo_codes) ? r.promo_codes[0] : r.promo_codes
    const base = {
      id: r.id,
      promoCode: promo?.code ?? '—',
      applicantName: maskTravelerName(app?.name ?? app?.email),
      batchSlug: app?.batch_slug ?? '—',
      commissionAmount: r.commission_amount,
      status: r.status,
      paidAt: r.paid_at,
      createdAt: r.created_at,
    }
    if (!includeDetail) return base
    return {
      ...base,
      rawApplicantName: app?.name ?? null,
      departureId: app?.departure_id ?? null,
    }
  }

  const { data: mouSig } = await service
    .from('mou_signatures')
    .select('full_name_confirmed, signed_at')
    .eq('influencer_id', influencerId)
    .order('signed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const payload: Record<string, unknown> = {
    influencer: {
      id: influencerId,
      name: influencer.name,
      email: influencer.email,
      phone: influencer.phone,
      status: influencer.status,
      bio: influencer.bio,
      instagramHandle: influencer.instagram_handle,
      payoutUpi: influencer.payout_upi,
      payoutBankName: influencer.payout_bank_name,
      payoutAccountHolder: influencer.payout_account_holder,
      payoutAccountNumber: influencer.payout_account_number,
      payoutIfsc: influencer.payout_ifsc,
      mouSigned: Boolean(influencer.mou_signed),
      mouSignedAt: influencer.mou_signed_at,
      mouSignerName: mouSig?.full_name_confirmed ?? null,
      panVerified: Boolean(influencer.pan_verified),
      panNumber: influencer.pan_number,
      panDocUrl: influencer.pan_doc_url,
      cashPayoutsThisYear: Number(influencer.cash_payouts_this_year ?? 0),
      tripFmvThisYear: Number(influencer.trip_fmv_this_year ?? 0),
      freeTripsUsedThisYear: influencer.free_trips_used_this_year ?? 0,
      freeTripsResetYear: influencer.free_trips_reset_year ?? 2026,
    },
    stats: {
      totalCodes: promos?.length ?? 0,
      totalRedemptions: rows.length,
      pendingCommissionPaise: sum(pending),
      approvedCommissionPaise: sum(approved),
      paidOutCommissionPaise: sum(paidOut),
    },
    promoCodes: (promos ?? []).map((p) => ({
      id: p.id,
      code: p.code,
      discountType: p.discount_type,
      discountValue: p.discount_value,
      commissionAmount: p.commission_amount,
      usesCount: p.uses_count,
      maxUses: p.max_uses,
      active: p.active,
      shareUrl: buildPartnerShareUrl(p.code, SITE_URL),
    })),
    recentRedemptions: rows.slice(0, 5).map((r) => mapRedemption(r)),
    monthlyCommissions,
    redemptions: rows.map((r) => mapRedemption(r)),
  }

  if (view === 'bookings') {
    payload.bookings = rows.map((r) => mapRedemption(r, true))
  }

  return payload
}
