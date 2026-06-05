'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import PortalBackLink from '@/components/layout/PortalBackLink'
import NotificationPanel, { type NotificationRow } from '@/components/partner/NotificationPanel'
import { getPortalNav, type PortalNavItem } from '@/lib/portal-nav-config'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

type PortalShellProps = {
  variant: 'member' | 'partner' | 'admin'
  brand: string
  homeHref: string
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
  signOutHref,
  children,
}: PortalShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const baseNav = useMemo(() => getPortalNav(variant), [variant])
  const [badges, setBadges] = useState<Record<string, number>>({})
  const [onboarding, setOnboarding] = useState({ mouSigned: true, panVerified: true })
  const [unread, setUnread] = useState(0)
  const [panelOpen, setPanelOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationRow[]>([])

  const nav = useMemo(() => {
    if (variant !== 'partner') return baseNav
    return baseNav.filter((item) => {
      if (item.href.includes('/onboarding/mou')) return !onboarding.mouSigned
      if (item.href.includes('/onboarding/kyc')) return onboarding.mouSigned && !onboarding.panVerified
      return !item.highlight
    })
  }, [baseNav, variant, onboarding])

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

  const fetchBadges = useCallback(async () => {
    if (variant === 'partner') {
      const me = await fetch('/api/partner/me').then((r) => r.json())
      if (me.influencer) {
        setOnboarding({
          mouSigned: Boolean(me.influencer.mouSigned),
          panVerified: Boolean(me.influencer.panVerified),
        })
      }
      const content = await fetch('/api/partner/content').then((r) => r.json())
      const overdue = (content.items ?? []).filter(
        (i: { status: string }) => i.status === 'overdue'
      ).length
      setBadges((b) => ({ ...b, 'content-overdue': overdue }))
      const n = await fetch('/api/partner/notifications?count=true').then((r) => r.json())
      setUnread(n.unread ?? 0)
    }
    if (variant === 'admin') {
      const overview = await fetch('/api/admin/overview').then((r) => r.json()).catch(() => ({}))
      setBadges({
        'content-review': overview.pendingContentReviews ?? 0,
        applications: overview.pendingApplications ?? 0,
      })
      const n = await fetch('/api/admin/notifications?count=true').then((r) => r.json()).catch(() => ({}))
      setUnread(n.unread ?? 0)
    }
  }, [variant])

  const loadNotifications = useCallback(async () => {
    const url =
      variant === 'admin' ? '/api/admin/notifications' : '/api/partner/notifications'
    const json = await fetch(url).then((r) => r.json())
    setNotifications(json.notifications ?? [])
  }, [variant])

  useEffect(() => {
    fetchBadges()
    const id = setInterval(fetchBadges, 60000)
    return () => clearInterval(id)
  }, [fetchBadges])

  useEffect(() => {
    if (panelOpen) loadNotifications()
  }, [panelOpen, loadNotifications])

  const markRead = async (id: string) => {
    const base =
      variant === 'admin' ? '/api/admin/notifications' : '/api/partner/notifications'
    await fetch(`${base}/${id}`, { method: 'PATCH' })
    loadNotifications()
    fetchBadges()
  }

  const markAllRead = async () => {
    for (const n of notifications.filter((x) => !x.read)) {
      await markRead(n.id)
    }
  }

  const onMobileNavChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const href = e.target.value
      if (href && href !== pathname) router.push(href)
    },
    [pathname, router]
  )

  const showBell = variant === 'partner' || variant === 'admin'

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
            const badge = item.badgeKey ? badges[item.badgeKey] : 0
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`portal-sidebar-link${active ? ' active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
                {badge > 0 && <span className="portal-nav-badge">{badge}</span>}
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
              value={activeItem?.href ?? homeHref}
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

        <main className={`portal-content portal-content--${variant}`}>
          {showBell && (
            <div className="portal-topbar">
              <div className="portal-bell-wrap">
                <button
                  type="button"
                  className="portal-bell-btn"
                  aria-label="Notifications"
                  onClick={() => setPanelOpen((o) => !o)}
                >
                  🔔
                </button>
                {unread > 0 && <span className="portal-bell-badge">{unread}</span>}
              </div>
            </div>
          )}
          {children}
        </main>

        <div className="portal-mobile-signout-wrap">
          <button type="button" className="portal-signout portal-mobile-signout" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>

      {showBell && (
        <NotificationPanel
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          items={notifications}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
        />
      )}
    </div>
  )
}
