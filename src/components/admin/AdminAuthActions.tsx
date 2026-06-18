'use client'

import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import PortalSignOutButton from '@/components/auth/PortalSignOutButton'

type AdminAuthActionsProps = {
  message?: string
}

export default function AdminAuthActions({ message }: AdminAuthActionsProps) {
  return (
    <div className="admin-auth-actions">
      {message ? (
        <p className="admin-msg" style={{ color: 'var(--rose)', marginBottom: 12 }}>
          {message}
        </p>
      ) : null}
      <div className="admin-auth-actions-row">
        <PortalSignOutButton redirectTo={ROUTES.adminLogin} className="admin-btn" />
        <Link href={ROUTES.adminLogin} className="admin-inline-link">
          Sign in again →
        </Link>
      </div>
    </div>
  )
}
