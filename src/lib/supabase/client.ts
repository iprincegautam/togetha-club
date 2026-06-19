import { createBrowserClient } from '@supabase/ssr'

function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Supabase is not configured in this build. Redeploy with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY set at build time.'
    )
  }
  return { url, key }
}

export function createBrowserSupabaseClient() {
  const { url, key } = getSupabasePublicEnv()
  return createBrowserClient(url, key)
}
