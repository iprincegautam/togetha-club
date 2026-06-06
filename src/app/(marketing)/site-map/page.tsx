import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { buildMetadata } from '@/lib/metadata'
import { getFeaturedSiteMapSections, getPublicSitemapEntries } from '@/lib/sitemap-pages'
import '@/components/legal/legal.css'

export function generateMetadata() {
  return buildMetadata(
    'Site Map — Togetha.Club',
    'Browse all public pages on Togetha.Club — batches, match quiz, journal, about, and support.'
  )
}

export default function SiteMapPage() {
  const featured = getFeaturedSiteMapSections()
  const all = getPublicSitemapEntries()

  return (
    <div className="legal-page">
      <div className="legal-shell">
        <p className="legal-eyebrow">Navigation</p>
        <h1 className="legal-title">Site Map</h1>
        <p className="legal-intro">
          Quick links to every public section of {ROUTES.home === '/' ? 'Togetha.Club' : 'our site'}.
          These are the pages we want search engines and new visitors to find first.
        </p>

        <section className="legal-section" aria-labelledby="featured-pages">
          <h2 id="featured-pages">Main sections</h2>
          <ul className="site-map-list">
            {featured.map((entry) => (
              <li key={entry.path}>
                <Link href={entry.path}>{entry.title}</Link>
                <p className="site-map-desc">{entry.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="legal-section" aria-labelledby="all-pages">
          <h2 id="all-pages">All public pages</h2>
          <ul className="site-map-compact">
            {all.map((entry) => (
              <li key={entry.path}>
                <Link href={entry.path}>{entry.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
