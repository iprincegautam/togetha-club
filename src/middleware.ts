import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { userHasPartnerAccess } from '@/lib/auth/partner'
import { userHasAdminAccess } from '@/lib/auth/roles'
import {
  ACCOUNT_AUTH_PATHS,
  ADMIN_AUTH_PATHS,
  PARTNER_AUTH_PATHS,
} from '@/lib/portal-path'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return supabaseResponse

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  if (
    ACCOUNT_AUTH_PATHS.has(pathname) ||
    PARTNER_AUTH_PATHS.has(pathname) ||
    ADMIN_AUTH_PATHS.has(pathname)
  ) {
    supabaseResponse.headers.set('x-portal-auth-page', '1')
  }

  // ── Admin routes ──
  const isAdminLogin = pathname === '/admin/login'
  const isAdmin = pathname.startsWith('/admin')

  if (isAdmin && !isAdminLogin && !session) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    return NextResponse.redirect(loginUrl)
  }

  if (isAdmin && !isAdminLogin && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()

    if (!userHasAdminAccess(profile, session.user.email)) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      loginUrl.searchParams.set('error', 'forbidden')
      return NextResponse.redirect(loginUrl)
    }
  }

  if (isAdminLogin && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()

    if (userHasAdminAccess(profile, session.user.email)) {
      const adminUrl = request.nextUrl.clone()
      adminUrl.pathname = '/admin'
      return NextResponse.redirect(adminUrl)
    }
  }

  // ── Member account routes ──
  const isAccountLogin = pathname === '/account/login'
  const isAccountPublic = ACCOUNT_AUTH_PATHS.has(pathname)
  const isAccount = pathname.startsWith('/account')

  if (isAccount && !isAccountPublic && !session) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/account/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAccountLogin && session) {
    const accountUrl = request.nextUrl.clone()
    accountUrl.pathname = '/account'
    accountUrl.search = ''
    return NextResponse.redirect(accountUrl)
  }

  // ── Partner / influencer routes ──
  const isPartnerPublic = PARTNER_AUTH_PATHS.has(pathname)
  const isPartner = pathname.startsWith('/partner')

  if (isPartner && !isPartnerPublic && !session) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/partner/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isPartner && !isPartnerPublic && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, influencer_id')
      .eq('id', session.user.id)
      .maybeSingle()

    if (!userHasPartnerAccess(profile)) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/partner/login'
      loginUrl.searchParams.set('error', 'forbidden')
      return NextResponse.redirect(loginUrl)
    }
  }

  if (isPartnerPublic && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, influencer_id')
      .eq('id', session.user.id)
      .maybeSingle()

    if (userHasPartnerAccess(profile)) {
      const partnerUrl = request.nextUrl.clone()
      partnerUrl.pathname = '/partner'
      partnerUrl.search = ''
      return NextResponse.redirect(partnerUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/partner/:path*'],
}
