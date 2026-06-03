export const ROUTES = {
  home: '/',
  batches: '/batches',
  batchDetail: (slug: string) => `/batches/${slug}`,
  apply: (slug: string) => `/apply/${slug}`,
  confirmation: '/confirmation',
  waitlist: '/waitlist',
  admin: '/admin',
  adminAffiliates: '/admin/affiliates',
  adminLogin: '/admin/login',
} as const
