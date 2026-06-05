import { NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/auth/admin'

export async function GET() {
  const auth = await requireAdminApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const s = auth.service

  const [
    creators,
    activeCreators,
    bookings,
    commissions,
    pendingContent,
    pendingApps,
    overdueContent,
    tdsAlerts,
    staleApps,
    unsignedMou,
    recentNotifs,
    dailyBookings,
  ] = await Promise.all([
    s.from('influencers').select('id', { count: 'exact', head: true }),
    s.from('influencers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    s.from('promo_redemptions').select('id', { count: 'exact', head: true }),
    s
      .from('promo_redemptions')
      .select('commission_amount')
      .in('status', ['approved', 'paid_out', 'paid']),
    s.from('content_items').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
    s.from('influencers').select('id', { count: 'exact', head: true }).eq('status', 'applied'),
    s
      .from('content_items')
      .select('id, type, due_date, influencers(name), batches(name)')
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString())
      .limit(5),
    s
      .from('influencers')
      .select('name, cash_payouts_this_year, trip_fmv_this_year')
      .or('cash_payouts_this_year.gt.40000,trip_fmv_this_year.gt.15000'),
    s
      .from('influencers')
      .select('name, created_at')
      .eq('status', 'applied')
      .lt('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    s
      .from('influencers')
      .select('name')
      .eq('status', 'approved')
      .eq('mou_signed', false)
      .lt('created_at', new Date(Date.now() - 3 * 86400000).toISOString()),
    s
      .from('notifications')
      .select('*')
      .eq('is_admin', true)
      .order('created_at', { ascending: false })
      .limit(20),
    s
      .from('promo_redemptions')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString()),
  ])

  const commissionSum = (commissions.data ?? []).reduce(
    (acc, r) => acc + (r.commission_amount ?? 0),
    0
  )

  const dayMap = new Map<string, number>()
  for (const r of dailyBookings.data ?? []) {
    const d = new Date(r.created_at).toISOString().slice(0, 10)
    dayMap.set(d, (dayMap.get(d) ?? 0) + 1)
  }

  const bookingsChart = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  return NextResponse.json({
    totalCreators: creators.count ?? 0,
    activeCreators: activeCreators.count ?? 0,
    totalBookings: bookings.count ?? 0,
    totalCommissionsPaidPaise: commissionSum,
    pendingContentReviews: pendingContent.count ?? 0,
    pendingApplications: pendingApps.count ?? 0,
    alerts: {
      overdueContent: overdueContent.data ?? [],
      tdsAlerts: tdsAlerts.data ?? [],
      staleApplications: staleApps.data ?? [],
      unsignedMou: unsignedMou.data ?? [],
    },
    activity: recentNotifs.data ?? [],
    bookingsChart,
  })
}
