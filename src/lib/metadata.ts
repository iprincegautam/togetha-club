import type { Metadata } from 'next'

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000'

export const DEFAULT_TITLE = "Togetha.Club — India's First Matchmaking Travel Club"

export const DEFAULT_DESCRIPTION =
  'AI-matched singles. 6 days in the Himalayas. Real connection.'

export function buildMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: SITE_URL,
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
