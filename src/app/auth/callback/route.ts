import { NextResponse } from 'next/server'
import { createServerAuthClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/account/reset-password'

  if (code) {
    const supabase = await createServerAuthClient()
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        const safeNext = next.startsWith('/') ? next : '/account/reset-password'
        return NextResponse.redirect(`${origin}${safeNext}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/account/login?error=auth_callback`)
}
