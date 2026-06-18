import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getPublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return url && key ? { url, key } : null
}

/** Sync anon client — public reads only. RLS applies. */
export function tryCreateServerSupabaseClient(): SupabaseClient | null {
  const env = getPublicEnv()
  if (!env) return null
  return createClient(env.url, env.key)
}

/** @deprecated Use tryCreateServerSupabaseClient */
export function createServerSupabaseClient(): SupabaseClient {
  const client = tryCreateServerSupabaseClient()
  if (!client) throw new Error('Missing Supabase environment variables')
  return client
}

/** Service role client — bypasses RLS. Use only in server API routes. */
export function tryCreateServiceRoleClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export function createServiceRoleClient(): SupabaseClient {
  const client = tryCreateServiceRoleClient()
  if (!client) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  return client
}

/** Auth-aware server client with cookie session. */
export async function createServerAuthClient(): Promise<SupabaseClient | null> {
  const env = getPublicEnv()
  if (!env) return null

  const cookieStore = await cookies()

  return createSupabaseServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // setAll called from Server Component — safe to ignore
        }
      },
    },
  })
}

export async function getAdminSession() {
  const supabase = await createServerAuthClient()
  if (!supabase) return { supabase: null, session: null }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { supabase, session: null }
  }

  return { supabase, session: { user } }
}

/** @deprecated Use tryCreateServerSupabaseClient */
export const createServerClient = createServerSupabaseClient
