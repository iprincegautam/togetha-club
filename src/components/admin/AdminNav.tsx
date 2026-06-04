'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

const NAV = [
  { href: ROUTES.admin, label: 'Applicants' },
  { href: ROUTES.adminBatches, label: 'Batches' },
  { href: ROUTES.adminWaitlist, label: 'Waitlist' },
  { href: ROUTES.adminAffiliates, label: 'Affiliates' },
] as const

export default function AdminNav() {
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push(ROUTES.adminLogin)
    router.refresh()
  }

  return (
    <header className="admin-nav">
      <Link href={ROUTES.admin} className="admin-nav-logo">
        ✦ Togetha.Club Admin
      </Link>
      <nav className="admin-nav-links-bar">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              pathname === item.href || pathname.startsWith(`${item.href}/`)
                ? 'active'
                : undefined
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <button type="button" className="admin-nav-signout" onClick={handleSignOut}>
        Sign out
      </button>
    </header>
  )
}
