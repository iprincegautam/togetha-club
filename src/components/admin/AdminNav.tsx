'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export default function AdminNav() {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push(ROUTES.adminLogin)
    router.refresh()
  }

  return (
    <header className="admin-nav">
      <Link href={ROUTES.admin} className="admin-nav-logo">
        ✈ Togetha.Club Admin
      </Link>
      <button type="button" className="admin-nav-signout" onClick={handleSignOut}>
        Sign out
      </button>
    </header>
  )
}
