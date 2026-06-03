'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

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
        <Link
          href={ROUTES.admin}
          className={pathname === ROUTES.admin ? 'active' : undefined}
        >
          Applicants
        </Link>
        <Link
          href="/admin/affiliates"
          className={pathname === '/admin/affiliates' ? 'active' : undefined}
        >
          Affiliates
        </Link>
      </nav>
      <button type="button" className="admin-nav-signout" onClick={handleSignOut}>
        Sign out
      </button>
    </header>
  )
}
