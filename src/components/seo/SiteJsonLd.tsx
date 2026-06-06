import { BUSINESS } from '@/config/business'
import { SITE_URL } from '@/lib/metadata'
import { getFeaturedSiteMapSections } from '@/lib/sitemap-pages'

const LOGO_URL = `${SITE_URL}/logo.png`

export default function SiteJsonLd() {
  const navigation = getFeaturedSiteMapSections().map((entry, index) => ({
    '@type': 'SiteNavigationElement',
    position: index + 1,
    name: entry.title,
    description: entry.description,
    url: `${SITE_URL}${entry.path}`,
  }))

  const graph = [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: BUSINESS.tradingName,
      legalName: BUSINESS.legalName,
      url: SITE_URL,
      logo: LOGO_URL,
      image: LOGO_URL,
      description:
        "India's first matchmaking travel club — AI-matched singles on curated 6-day experiences in the Himalayas.",
      email: BUSINESS.supportEmail,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'New Delhi',
        addressCountry: 'IN',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: BUSINESS.supportEmail,
        availableLanguage: ['English', 'Hindi'],
      },
      sameAs: ['https://instagram.com/togetha.club'],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: BUSINESS.tradingName,
      description:
        'Book matchmaking travel batches, take the AI compatibility quiz, and join screened singles in the Himalayas.',
      inLanguage: 'en-IN',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'ItemList',
      '@id': `${SITE_URL}/#primary-navigation`,
      name: 'Primary site navigation',
      itemListElement: navigation,
    },
  ]

  const payload = {
    '@context': 'https://schema.org',
    '@graph': graph,
  }

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }} />
  )
}
