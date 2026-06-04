import { ROUTES } from '@/constants/routes'
import type { PortalNavItem } from '@/components/layout/PortalShell'

export const MEMBER_PORTAL_NAV: readonly PortalNavItem[] = [
  { href: ROUTES.account, label: 'My booking' },
  { href: ROUTES.accountPayments, label: 'Payments' },
  { href: ROUTES.accountProfile, label: 'Profile' },
  { href: ROUTES.accountSettings, label: 'Settings' },
]

export const PARTNER_PORTAL_NAV: readonly PortalNavItem[] = [
  { href: ROUTES.partner, label: 'Dashboard' },
  { href: ROUTES.partnerProfile, label: 'Profile' },
  { href: ROUTES.partnerSettings, label: 'Settings' },
]

export const ADMIN_PORTAL_NAV: readonly PortalNavItem[] = [
  {
    href: ROUTES.admin,
    label: 'Applicants',
    isActive: (p) => p === ROUTES.admin || p.startsWith('/admin/applicants'),
  },
  { href: ROUTES.adminBatches, label: 'Batches', match: 'prefix' },
  { href: ROUTES.adminWaitlist, label: 'Waitlist', match: 'exact' },
  { href: ROUTES.adminAffiliates, label: 'Affiliates', match: 'exact' },
]
