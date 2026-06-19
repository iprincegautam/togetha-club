'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

type PortalSignOutButtonProps = {
  redirectTo: string
  label?: string
  className?: string
}

export default function PortalSignOutButton({
  redirectTo,
  label = 'Sign out',
  className = 'admin-btn',
}: PortalSignOutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const signOut = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      const supabase = createBrowserSupabaseClient()
      await supabase.auth.signOut()
    } catch {
      // Still redirect — user may need to sign in again manually.
    } finally {
      router.push(redirectTo)
      router.refresh()
      setLoading(false)
    }
  }

  return (
    <button type="button" className={className} onClick={signOut} disabled={loading}>
      {loading ? 'Signing out…' : label}
    </button>
  )
}
