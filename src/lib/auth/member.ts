import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerAuthClient } from '@/lib/supabase/server'
import type { ProfileRow } from '@/lib/auth/roles'

export {
  activeStageIndex,
  bookingPipelineState,
  bookingStageFromStatus,
  BOOKING_STAGES,
} from '@/lib/booking-stages'
export type { BookingStage, BookingPipelineState } from '@/lib/booking-stages'

export async function getMemberContext() {
  const supabase = await createServerAuthClient()
  if (!supabase) {
    return { supabase: null, session: null, profile: null, applicant: null }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { supabase, session: null, profile: null, applicant: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle()

  if (!profile?.applicant_id) {
    return { supabase, session, profile: profile as ProfileRow | null, applicant: null }
  }

  const { data: applicant } = await supabase
    .from('applicants')
    .select(
      `
      *,
      batches ( name, slug, price ),
      batch_departures ( label, departure_date )
    `
    )
    .eq('id', profile.applicant_id)
    .maybeSingle()

  return {
    supabase,
    session,
    profile: profile as ProfileRow | null,
    applicant,
  }
}

export async function requireMemberApiAccess() {
  const ctx = await getMemberContext()
  if (!ctx.session) {
    return { error: 'Unauthorized' as const, status: 401 as const }
  }
  if (!ctx.profile?.applicant_id || !ctx.applicant) {
    return { error: 'No booking linked to this account' as const, status: 403 as const }
  }

  const { tryCreateServiceRoleClient } = await import('@/lib/supabase/server')
  const service = tryCreateServiceRoleClient()
  if (!service) {
    return { error: 'Server configuration error' as const, status: 500 as const }
  }

  return { ...ctx, service }
}

export async function requireMemberSession() {
  const ctx = await getMemberContext()
  if (!ctx.session) return null
  return ctx
}
