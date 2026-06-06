import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/metadata'
import { getPublicSitemapEntries } from '@/lib/sitemap-pages'

export default function sitemap(): MetadataRoute.Sitemap {
  return getPublicSitemapEntries().map((entry) => ({
    url: `${SITE_URL}${entry.path}`,
    lastModified: entry.lastModified ?? new Date(),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }))
}
