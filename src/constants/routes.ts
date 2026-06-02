export const ROUTES = {
  home: '/',
  batches: '/batches',
  batchDetail: (slug: string) => `/batches/${slug}`,
  apply: (slug: string) => `/apply/${slug}`,
  confirmation: '/confirmation',
  waitlist: '/waitlist',
  admin: '/admin',
  adminLogin: '/admin/login',
} as const
