'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import PortalBackLink from '@/components/layout/PortalBackLink'

const NAV = [
  { href: ROUTES.account, label: 'My booking' },
  { href: ROUTES.accountProfile, label: 'Profile' },
  { href: ROUTES.accountSettings, label: 'Settings' },
] as const

export default function AccountNav() {
  const router = useRouter()
  const pathname = usePathname()

  const signOut = async () => {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push(ROUTES.accountLogin)
    router.refresh()
  }

  return (
    <header className="account-nav">
      <div className="portal-nav-start">
        <PortalBackLink variant="dark" />
        <Link href={ROUTES.account} className="account-nav-logo">
          ✦ My Togetha.Club
        </Link>
      </div>
      <nav className="account-nav-links">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? 'active' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <button type="button" className="account-nav-signout" onClick={signOut}>
        Sign out
      </button>
    </header>
  )
}
