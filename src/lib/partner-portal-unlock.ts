import type { SupabaseClient } from '@supabase/supabase-js'
import { notifyInfluencer } from '@/lib/notifications'

export type ContentItemType = 'pre_trip' | 'daily_story' | 'post_trip'

/** Daily/post content stays locked until admin approves the announcement. */
export function isContentTypePortalLocked(
  type: string,
  portalUnlocked: boolean
): boolean {
  if (type === 'pre_trip') return false
  return !portalUnlocked
}

export async function unlockPartnerPortal(
  service: SupabaseClient,
  influencerId: string
): Promise<boolean> {
  const { data: inf } = await service
    .from('influencers')
    .select('portal_unlocked, name')
    .eq('id', influencerId)
    .maybeSingle()

  if (!inf || inf.portal_unlocked) return false

  const now = new Date().toISOString()
  const { error } = await service
    .from('influencers')
    .update({ portal_unlocked: true, portal_unlocked_at: now })
    .eq('id', influencerId)

  if (error) {
    console.error('[unlockPartnerPortal]', error.message)
    return false
  }

  await notifyInfluencer(service, {
    influencerId,
    type: 'portal_unlocked',
    title: 'Portal unlocked!',
    body: 'Your announcement was approved. My trips and your full content calendar are now active.',
  })

  return true
}

export function portalProgress(input: {
  portalUnlocked: boolean
  announcementStatus: string | null
}): { step: number; total: number; label: string } {
  const total = 2
  if (input.portalUnlocked) {
    return { step: 2, total, label: 'Portal unlocked — book your trip!' }
  }
  if (input.announcementStatus === 'submitted') {
    return { step: 1, total, label: 'Announcement under review (~30 min)' }
  }
  if (input.announcementStatus === 'rejected') {
    return { step: 0, total, label: 'Revise your announcement to continue' }
  }
  return { step: 0, total, label: 'Post your announcement to unlock everything' }
}
