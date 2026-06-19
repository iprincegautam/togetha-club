import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { userHasPartnerAccess } from '@/lib/auth/partner'
import { isBootstrapAdminEmail, userHasAdminAccess } from '@/lib/auth/roles'
import {
  ACCOUNT_AUTH_PATHS,
  ACCOUNT_SETUP_PATHS,
  ADMIN_AUTH_PATHS,
  PARTNER_AUTH_PATHS,
} from '@/lib/portal-path'

function isPortalAuthPage(pathname: string): boolean {
  return (
    ACCOUNT_AUTH_PATHS.has(pathname) ||
    ACCOUNT_SETUP_PATHS.has(pathname) ||
    PARTNER_AUTH_PATHS.has(pathname) ||
    ADMIN_AUTH_PATHS.has(pathname)
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)
  if (isPortalAuthPage(pathname)) {
    requestHeaders.set('x-portal-auth-page', '1')
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })

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
        supabaseResponse = NextResponse.next({
          request: { headers: requestHeaders },
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const session = user ? { user } : null

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

    const hasAdminAccess =
      userHasAdminAccess(profile, session.user.email) ||
      isBootstrapAdminEmail(session.user.email)

    if (!hasAdminAccess) {
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

    const hasAdminAccess =
      userHasAdminAccess(profile, session.user.email) ||
      isBootstrapAdminEmail(session.user.email)

    if (hasAdminAccess) {
      const adminUrl = request.nextUrl.clone()
      adminUrl.pathname = '/admin'
      return NextResponse.redirect(adminUrl)
    }
  }

  // ── Member account routes ──
  const isAccountLogin = pathname === '/account/login'
  const isAccountPublic = ACCOUNT_AUTH_PATHS.has(pathname)
  const isAccountSetup = ACCOUNT_SETUP_PATHS.has(pathname)
  const isAccount = pathname.startsWith('/account')

  if (isAccount && !isAccountPublic && !isAccountSetup && !session) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/account/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAccountLogin && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('password_change_required')
      .eq('id', session.user.id)
      .maybeSingle()

    const accountUrl = request.nextUrl.clone()
    accountUrl.pathname = profile?.password_change_required
      ? '/account/change-password'
      : '/account'
    accountUrl.search = ''
    return NextResponse.redirect(accountUrl)
  }

  if (isAccountSetup && !session) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/account/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAccount && session && !isAccountPublic) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('password_change_required')
      .eq('id', session.user.id)
      .maybeSingle()

    if (
      profile?.password_change_required &&
      pathname !== '/account/change-password'
    ) {
      const changeUrl = request.nextUrl.clone()
      changeUrl.pathname = '/account/change-password'
      changeUrl.search = ''
      return NextResponse.redirect(changeUrl)
    }
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
  matcher: [
    '/admin/:path*',
    '/account/:path*',
    '/partner/:path*',
    '/api/admin/:path*',
    '/api/account/:path*',
    '/api/partner/:path*',
    '/api/auth/signout',
  ],
}
