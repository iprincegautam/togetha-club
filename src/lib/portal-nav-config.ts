import { ROUTES } from '@/constants/routes'

export type PortalNavItem = {
  href: string
  label: string
  match?: 'exact' | 'prefix'
  isActive?: (pathname: string) => boolean
  badgeKey?: 'content-overdue' | 'content-review' | 'applications'
  highlight?: boolean
}

const MEMBER_PORTAL_NAV: readonly PortalNavItem[] = [
  { href: ROUTES.account, label: 'My booking' },
  { href: ROUTES.accountCompleteProfile, label: 'Complete profile', highlight: true },
  { href: ROUTES.accountPayments, label: 'Payments' },
  { href: ROUTES.accountProfile, label: 'Profile' },
  { href: ROUTES.accountSettings, label: 'Settings' },
]

const PARTNER_PORTAL_NAV: readonly PortalNavItem[] = [
  { href: ROUTES.partnerMou, label: 'Sign agreement', match: 'prefix', highlight: true },
  { href: ROUTES.partnerKyc, label: 'Verify identity', match: 'prefix', highlight: true },
  { href: ROUTES.partner, label: 'Dashboard' },
  { href: ROUTES.partnerBookings, label: 'Bookings' },
  { href: ROUTES.partnerContent, label: 'Content', badgeKey: 'content-overdue' },
  { href: ROUTES.partnerTrips, label: 'My trips' },
  { href: ROUTES.partnerPayouts, label: 'Payouts' },
  { href: ROUTES.partnerProfile, label: 'Profile' },
  { href: ROUTES.partnerSettings, label: 'Settings' },
]

const ADMIN_PORTAL_NAV: readonly PortalNavItem[] = [
  { href: ROUTES.adminOverview, label: 'Overview' },
  {
    href: ROUTES.admin,
    label: 'Applicants',
    isActive: (p) => p === ROUTES.admin || p.startsWith('/admin/applicants'),
    badgeKey: 'applications',
  },
  { href: ROUTES.adminProvisionMember, label: 'Direct login', match: 'prefix' },
  { href: ROUTES.adminBatches, label: 'Batches', match: 'prefix' },
  { href: ROUTES.adminWaitlist, label: 'Waitlist', match: 'exact' },
  { href: ROUTES.adminAffiliates, label: 'Affiliates', match: 'prefix' },
  { href: ROUTES.adminContent, label: 'Content review', badgeKey: 'content-review' },
  { href: ROUTES.adminAnnotate, label: 'DM annotations', match: 'prefix' },
  { href: ROUTES.adminPayouts, label: 'Payouts' },
  { href: ROUTES.adminNotifications, label: 'Notifications' },
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
