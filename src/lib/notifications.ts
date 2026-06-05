import type { SupabaseClient } from '@supabase/supabase-js'

export async function insertNotification(
  service: SupabaseClient,
  input: {
    influencerId?: string | null
    isAdmin?: boolean
    type: string
    title: string
    body: string
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  const { error } = await service.from('notifications').insert({
    influencer_id: input.influencerId ?? null,
    is_admin: input.isAdmin ?? false,
    type: input.type,
    title: input.title,
    body: input.body,
    metadata: input.metadata ?? {},
  })
  if (error) console.error('[insertNotification]', error.message)
}

export async function notifyAdmin(
  service: SupabaseClient,
  input: { type: string; title: string; body: string; metadata?: Record<string, unknown> }
): Promise<void> {
  await insertNotification(service, { ...input, isAdmin: true })
}

export async function notifyInfluencer(
  service: SupabaseClient,
  input: {
    influencerId: string
    type: string
    title: string
    body: string
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  await insertNotification(service, { ...input, isAdmin: false })
}
