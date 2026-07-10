import { ROUTES } from '@/constants/routes'
import { withPromoQuery } from '@/lib/promo'

export function buildApplyUrl(
  batchSlug: string,
  options?: { dateIndex?: number | null; promo?: string | null }
): string {
  let url = withPromoQuery(ROUTES.apply(batchSlug), options?.promo)
  if (options?.dateIndex != null && options.dateIndex >= 0) {
    const sep = url.includes('?') ? '&' : '?'
    url = `${url}${sep}date=${options.dateIndex}`
  }
  return url
}
