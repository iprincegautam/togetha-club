'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import PortalBackLink from '@/components/layout/PortalBackLink'

export default function PartnerNav() {
  const router = useRouter()
  const pathname = usePathname()

  const signOut = async () => {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push(ROUTES.partnerLogin)
    router.refresh()
  }

  return (
    <header className="account-nav partner-nav">
      <div className="portal-nav-start">
        <PortalBackLink variant="dark" />
        <Link href={ROUTES.partner} className="account-nav-logo">
          ✦ Partner Portal
        </Link>
      </div>
      <nav className="account-nav-links">
        <Link href={ROUTES.partner} className={pathname === ROUTES.partner ? 'active' : undefined}>
          Dashboard
        </Link>
      </nav>
      <button type="button" className="account-nav-signout" onClick={signOut}>
        Sign out
      </button>
    </header>
  )
}
