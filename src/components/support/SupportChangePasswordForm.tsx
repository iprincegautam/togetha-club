'use client'

import AccountChangePasswordForm from '@/components/account/AccountChangePasswordForm'
import { ROUTES } from '@/constants/routes'

export default function SupportChangePasswordForm() {
  return <AccountChangePasswordForm firstLogin successRoute={ROUTES.support} />
}
