import { ROUTES } from '@/constants/routes'
import { withPromoQuery } from '@/lib/promo'

const DEFAULT_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || 'https://togetha.club'

/** Partner affiliate link — catalog first, promo applied through to checkout. */
export function buildPartnerShareUrl(code: string, origin = DEFAULT_ORIGIN): string {
  const base = origin.replace(/\/$/, '')
  return `${base}${withPromoQuery(ROUTES.batches, code)}`
}
