import type { Metadata } from 'next'
import { normalizeSiteUrl } from '@/lib/site-url'

export const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
)

export const DEFAULT_TITLE = "Togetha.Club — India's First Matchmaking Travel Club"

export const DEFAULT_DESCRIPTION =
  'Book matchmaking travel batches for verified singles. Take the AI quiz, pick your Friday, pay online, and join India\'s first matchmaking travel club.'

export function buildMetadata(
  title: string,
  description: string,
  path?: string
): Metadata {
  const pageUrl = path ? `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}` : SITE_URL

  return {
    title,
    description,
    alternates: path ? { canonical: pageUrl } : undefined,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'Togetha.Club',
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}
