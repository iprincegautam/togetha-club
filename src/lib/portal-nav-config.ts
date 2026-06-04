import { ROUTES } from '@/constants/routes'

export type PortalNavItem = {
  href: string
  label: string
  /** Default: exact path match */
  match?: 'exact' | 'prefix'
  isActive?: (pathname: string) => boolean
}

const MEMBER_PORTAL_NAV: readonly PortalNavItem[] = [
  { href: ROUTES.account, label: 'My booking' },
  { href: ROUTES.accountPayments, label: 'Payments' },
  { href: ROUTES.accountProfile, label: 'Profile' },
  { href: ROUTES.accountSettings, label: 'Settings' },
]

const PARTNER_PORTAL_NAV: readonly PortalNavItem[] = [
  { href: ROUTES.partner, label: 'Dashboard' },
  { href: ROUTES.partnerProfile, label: 'Profile' },
  { href: ROUTES.partnerSettings, label: 'Settings' },
]

const ADMIN_PORTAL_NAV: readonly PortalNavItem[] = [
  {
    href: ROUTES.admin,
    label: 'Applicants',
    isActive: (p) => p === ROUTES.admin || p.startsWith('/admin/applicants'),
  },
  { href: ROUTES.adminBatches, label: 'Batches', match: 'prefix' },
  { href: ROUTES.adminWaitlist, label: 'Waitlist', match: 'exact' },
  { href: ROUTES.adminAffiliates, label: 'Affiliates', match: 'exact' },
]

export function getPortalNav(variant: 'member' | 'partner' | 'admin'): readonly PortalNavItem[] {
  switch (variant) {
    case 'member':
      return MEMBER_PORTAL_NAV
    case 'partner':
      return PARTNER_PORTAL_NAV
    case 'admin':
      return ADMIN_PORTAL_NAV
  }
}
