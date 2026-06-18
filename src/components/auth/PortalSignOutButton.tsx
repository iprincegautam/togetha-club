'use client'

import { useRouter } from 'next/navigation'
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

  const signOut = async () => {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <button type="button" className={className} onClick={signOut}>
      {label}
    </button>
  )
}
