import { NextResponse } from 'next/server'
import { requirePartnerApiAccess } from '@/lib/auth/partner'
import { ensureDefaultContentProgram } from '@/lib/content-calendar'
import { sortContentItems } from '@/lib/content-calendar-sort'
import {
  isContentTypePortalLocked,
  portalProgress,
} from '@/lib/partner-portal-unlock'

export async function GET() {
  const auth = await requirePartnerApiAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  await ensureDefaultContentProgram(auth.service, auth.influencer.id)

  const portalUnlocked = Boolean(auth.influencer.portal_unlocked)

  const { data, error } = await auth.service
    .from('content_items')
    .select(
      `
      *,
      batches ( name ),
      batch_departures ( label, departure_date, return_date )
    `
    )
    .eq('influencer_id', auth.influencer.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const now = Date.now()
  let announcementStatus: string | null = null

  const items = sortContentItems(
    (data ?? []).map((row) => {
      const batch = Array.isArray(row.batches) ? row.batches[0] : row.batches
      const dep = Array.isArray(row.batch_departures)
        ? row.batch_departures[0]
        : row.batch_departures
      let status = row.status as string
      if (status === 'pending' && row.due_date && new Date(row.due_date).getTime() < now) {
        status = 'overdue'
      }
      if (row.type === 'pre_trip') {
        announcementStatus = status
      }
      const portalLocked = isContentTypePortalLocked(row.type, portalUnlocked)
      return {
        id: row.id,
        type: row.type,
        status,
        dueDate: row.due_date,
        scheduledUploadDate: row.scheduled_upload_date,
        submittedUrl: row.submitted_url,
        submittedAt: row.submitted_at,
        feedback: row.feedback,
        batchSlug: row.batch_slug,
        batchName: batch?.name ?? row.batch_slug,
        departureLabel: dep?.label ?? null,
        tripDepartureDate: dep?.departure_date ?? null,
        asciChecked: row.asci_checked,
        disclosureConfirmed: row.disclosure_confirmed,
        portalLocked,
      }
    })
  )

  const progress = portalProgress({ portalUnlocked, announcementStatus })

  return NextResponse.json({
    portalUnlocked,
    portalUnlockedAt: auth.influencer.portal_unlocked_at ?? null,
    announcementStatus,
    progress,
    items,
  })
}
