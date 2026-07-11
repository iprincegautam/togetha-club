export const ROUTES = {
  home: '/',
  howItWorks: '/how-it-works',
  match: '/match',
  /** Route batch interest through Our AI quiz for lead capture. */
  matchForBatch: (slug?: string) => {
    if (slug === 'batch-a' || slug === 'batch-b') {
      return `/match?destination=himalayan&batch=${slug}`
    }
    if (slug === 'batch-d' || slug === 'batch-e') {
      return `/match?destination=udaipur&batch=${slug}`
    }
    return '/match'
  },
  matchForDestination: (destination: 'himalayan' | 'udaipur', batchSlug?: string) => {
    const params = new URLSearchParams({ destination })
    if (
      batchSlug === 'batch-a' ||
      batchSlug === 'batch-b' ||
      batchSlug === 'batch-d' ||
      batchSlug === 'batch-e'
    ) {
      params.set('batch', batchSlug)
    }
    return `/match?${params.toString()}`
  },
  batches: '/batches',
  safety: '/safety',
  itineraries: '/itineraries',
  batchDetail: (slug: string) => `/batches/${slug}`,
  destinationDetail: (destination: 'himalayan' | 'udaipur') => `/batches/${destination}`,
  apply: (slug: string) => `/apply/${slug}`,
  confirmation: '/confirmation',
  waitlist: '/waitlist',
  terms: '/terms-and-conditions',
  privacy: '/privacy-policy',
  cancellationRefund: '/cancellation-and-refund',
  shipping: '/shipping-and-exchange',
  contact: '/contact-us',
  admin: '/admin',
  adminBatches: '/admin/batches',
  adminBatchDepartures: (slug: string) => `/admin/batches/${slug}`,
  adminApplicant: (id: string) => `/admin/applicants/${id}`,
  adminWaitlist: '/admin/waitlist',
  adminAffiliates: '/admin/affiliates',
  adminAffiliateDetail: (id: string) => `/admin/affiliates/${id}`,
  adminOverview: '/admin/overview',
  adminContent: '/admin/content',
  adminPayouts: '/admin/payouts',
  adminFinance: '/admin/finance',
  adminNotifications: '/admin/notifications',
  adminLogin: '/admin/login',
  adminProvisionMember: '/admin/provision-member',
  adminAnnotate: '/admin/annotate',
  adminSupportStaff: '/admin/support-staff',
  support: '/support',
  supportApplicants: '/support/applicants',
  supportApplicant: (id: string) => `/support/applicants/${id}`,
  supportProvisionMember: '/support/provision-member',
  supportWaitlist: '/support/waitlist',
  supportLogin: '/support/login',
  supportChangePassword: '/support/change-password',
  account: '/account',
  accountPayBalance: '/account#pay-balance',
  accountLogin: '/account/login',
  accountSignup: '/account/signup',
  accountForgotPassword: '/account/forgot-password',
  accountResetPassword: '/account/reset-password',
  accountChangePassword: '/account/change-password',
  accountProfile: '/account/profile',
  accountSettings: '/account/settings',
  accountPayments: '/account/payments',
  accountItinerary: '/account/itinerary',
  accountLogistics: '/account/logistics',
  accountCompleteProfile: '/account/complete-profile',
  partner: '/partner',
  partnerBookings: '/partner/bookings',
  partnerContent: '/partner/content',
  partnerTrips: '/partner/trips',
  partnerPayouts: '/partner/payouts',
  partnerMou: '/partner/onboarding/mou',
  partnerKyc: '/partner/onboarding/kyc',
  partnerProfile: '/partner/profile',
  partnerSettings: '/partner/settings',
  partnerLogin: '/partner/login',
  partnerSignup: '/partner/signup',
  partnerForgotPassword: '/partner/forgot-password',
  partnerResetPassword: '/partner/reset-password',
  authCallback: '/auth/callback',
  blog: '/blog',
  blogPost: (slug: string) => `/blog/${slug}`,
  about: '/about',
  siteMap: '/site-map',
  careers: '/careers',
  careersApply: '/careers/apply',
  careersTrack: (slug: string) => `/careers/${slug}`,
  careersApplyTrack: (slug: string) => `/careers/apply?track=${slug}`,
  adminInterns: '/admin/interns',
  adminIntern: (id: string) => `/admin/interns/${id}`,
} as const
