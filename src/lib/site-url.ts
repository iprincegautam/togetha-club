const DEFAULT_SITE_URL = 'https://togetha.club'

/** Normalize NEXT_PUBLIC_SITE_URL — fixes typos like `https:/domain` and strips paths. */
export function normalizeSiteUrl(raw?: string | null): string {
  if (!raw?.trim()) return DEFAULT_SITE_URL

  let value = raw.trim().replace(/\/$/, '')
  // Common typo: `https:/togetha.club` (single slash after scheme)
  value = value.replace(/^https:\/(?!\/)/, 'https://')
  value = value.replace(/^http:\/(?!\/)/, 'http://')

  try {
    const parsed = new URL(value)
    return parsed.origin
  } catch {
    return DEFAULT_SITE_URL
  }
}

export function absoluteSitePath(path: string, siteUrl?: string): string {
  const base = normalizeSiteUrl(siteUrl)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}
