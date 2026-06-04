'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import PortalBackLink from '@/components/layout/PortalBackLink'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export type PortalNavItem = {
  href: string
  label: string
  /** Default: exact path match */
  match?: 'exact' | 'prefix'
  isActive?: (pathname: string) => boolean
}

type PortalShellProps = {
  variant: 'member' | 'partner' | 'admin'
  brand: string
  homeHref: string
  nav: readonly PortalNavItem[]
  signOutHref: string
  children: React.ReactNode
}

function navItemActive(pathname: string, item: PortalNavItem): boolean {
  if (item.isActive) return item.isActive(pathname)
  if (item.match === 'prefix') {
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }
  return pathname === item.href
}

export default function PortalShell({
  variant,
  brand,
  homeHref,
  nav,
  signOutHref,
  children,
}: PortalShellProps) {
  const router = useRouter()
  const pathname = usePathname()

  const activeItem = useMemo(
    () => nav.find((item) => navItemActive(pathname, item)) ?? nav[0],
    [nav, pathname]
  )

  const signOut = async () => {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push(signOutHref)
    router.refresh()
  }

  const onMobileNavChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const href = e.target.value
      if (href && href !== pathname) router.push(href)
    },
    [pathname, router]
  )

  return (
    <div className={`portal-shell portal-shell--${variant}`}>
      <aside className="portal-sidebar" aria-label="Portal navigation">
        <div className="portal-sidebar-head">
          <PortalBackLink variant="dark" />
          <Link href={homeHref} className="portal-brand">
            {brand}
          </Link>
        </div>
        <div className="portal-sidebar-nav" role="navigation">
          {nav.map((item) => {
            const active = navItemActive(pathname, item)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`portal-sidebar-link${active ? ' active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
        <div className="portal-sidebar-foot">
          <button type="button" className="portal-signout" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="portal-frame">
        <div className="portal-mobile-bar">
          <div className="portal-mobile-bar-start">
            <PortalBackLink variant="dark" />
            <Link href={homeHref} className="portal-mobile-brand">
              {brand}
            </Link>
          </div>
          <label className="portal-nav-select-wrap">
            <span className="portal-nav-select-label">Go to</span>
            <select
              className="portal-nav-select"
              value={activeItem.href}
              onChange={onMobileNavChange}
              aria-label="Portal section"
            >
              {nav.map((item) => (
                <option key={item.href} value={item.href}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <main className={`portal-content portal-content--${variant}`}>{children}</main>
      </div>
    </div>
  )
}
