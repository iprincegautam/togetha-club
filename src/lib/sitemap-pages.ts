import { getAllBlogPosts } from '@/lib/blog'
import { getInternTrackSlugs } from '@/content/careers/roles'
import { ROUTES } from '@/constants/routes'

export type SitemapChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never'

export type PublicSitemapEntry = {
  path: string
  title: string
  description: string
  priority: number
  changeFrequency: SitemapChangeFrequency
  lastModified?: Date
  /** Shown on the HTML site map page */
  featured?: boolean
}

const BATCH_SLUGS = ['batch-a', 'batch-b', 'batch-c'] as const

const CORE_PAGES: PublicSitemapEntry[] = [
  {
    path: ROUTES.home,
    title: 'Home',
    description:
      "India's first matchmaking travel club — AI-matched singles, curated batches, and real connection in the Himalayas.",
    priority: 1,
    changeFrequency: 'weekly',
    featured: true,
  },
  {
    path: ROUTES.batches,
    title: 'Upcoming Batches',
    description:
      'Browse open matchmaking travel batches — GenZ and Millennial editions with live availability and pricing.',
    priority: 0.9,
    changeFrequency: 'daily',
    featured: true,
  },
  {
    path: ROUTES.match,
    title: 'Our AI Match Quiz',
    description:
      'Take the compatibility quiz to preview your cohort, vibe score, and best-fit batch before you apply.',
    priority: 0.9,
    changeFrequency: 'monthly',
    featured: true,
  },
  {
    path: ROUTES.howItWorks,
    title: 'How It Works',
    description:
      'From compatibility quiz to booking your slot — pay online, AI batch matching, and 6-day Himalayan experiences.',
    priority: 0.85,
    changeFrequency: 'monthly',
    featured: true,
  },
  {
    path: ROUTES.about,
    title: 'About Togetha.Club',
    description:
      'An experience-driven matchmaking travel club for screened singles — people first, the trip is the context.',
    priority: 0.8,
    changeFrequency: 'monthly',
    featured: true,
  },
  {
    path: ROUTES.careers,
    title: 'Careers — Join the Team',
    description:
      'Four founding roles — Visual Architect, Motion Storyteller, Member Experience Lead, Voice Architect. ₹15,000/month · 3 months → PPO.',
    priority: 0.75,
    changeFrequency: 'monthly',
    featured: true,
  },
  {
    path: ROUTES.contact,
    title: 'Contact Us',
    description:
      'Questions about applications, payments, refunds, or trip support? Reach the Togetha.Club team here.',
    priority: 0.7,
    changeFrequency: 'yearly',
    featured: true,
  },
  {
    path: ROUTES.blog,
    title: 'Journal',
    description:
      'Guides on matchmaking travel, dating app alternatives in India, and what happens on a Togetha experience.',
    priority: 0.8,
    changeFrequency: 'weekly',
    featured: true,
  },
  {
    path: ROUTES.waitlist,
    title: 'Join the Waitlist',
    description: 'Get notified when new batches, destinations, and festival editions open for applications.',
    priority: 0.6,
    changeFrequency: 'monthly',
  },
  {
    path: ROUTES.siteMap,
    title: 'Site Map',
    description: 'A full list of public pages on Togetha.Club.',
    priority: 0.3,
    changeFrequency: 'monthly',
  },
]

const LEGAL_PAGES: PublicSitemapEntry[] = [
  {
    path: ROUTES.terms,
    title: 'Terms & Conditions',
    description: 'Terms of use for Togetha.Club applications, bookings, and member experiences.',
    priority: 0.3,
    changeFrequency: 'yearly',
  },
  {
    path: ROUTES.privacy,
    title: 'Privacy Policy',
    description: 'How Togetha.Club collects, uses, and protects your personal data.',
    priority: 0.3,
    changeFrequency: 'yearly',
  },
  {
    path: ROUTES.cancellationRefund,
    title: 'Cancellation & Refunds',
    description: 'Refund timelines, cancellation fees, and slot booking policies.',
    priority: 0.3,
    changeFrequency: 'yearly',
  },
  {
    path: ROUTES.shipping,
    title: 'Shipping & Exchange',
    description: 'Digital service delivery and merchandise exchange policy.',
    priority: 0.2,
    changeFrequency: 'yearly',
  },
]

function batchPages(): PublicSitemapEntry[] {
  return BATCH_SLUGS.map((slug) => ({
    path: ROUTES.batchDetail(slug),
    title: slug === 'batch-a' ? 'Himalayan Love Trail — Batch A' : slug === 'batch-b' ? 'Himalayan Love Trail — Batch B' : 'Himalayan Love Trail — Batch C',
    description:
      slug === 'batch-c'
        ? 'Coming soon — the next exclusive matchmaking travel edition from Togetha.Club.'
        : '6-day matchmaking travel experience in Manali, Kasol, and Sissu for screened singles.',
    priority: 0.85,
    changeFrequency: 'weekly' as const,
    featured: slug !== 'batch-c',
  }))
}

function blogPages(): PublicSitemapEntry[] {
  return getAllBlogPosts().map((post) => ({
    path: ROUTES.blogPost(post.slug),
    title: post.title,
    description: post.excerpt,
    priority: 0.7,
    changeFrequency: 'monthly' as const,
    lastModified: new Date(post.updatedAt),
  }))
}

function careersTrackPages(): PublicSitemapEntry[] {
  return getInternTrackSlugs().map((slug) => ({
    path: ROUTES.careersTrack(slug),
    title: `Intern — ${slug}`,
    description: 'Founding team summer internship role at Togetha.Club',
    priority: 0.65,
    changeFrequency: 'monthly' as const,
  }))
}

export function getPublicSitemapEntries(): PublicSitemapEntry[] {
  return [...CORE_PAGES, ...batchPages(), ...blogPages(), ...careersTrackPages(), ...LEGAL_PAGES]
}

export function getFeaturedSiteMapSections(): PublicSitemapEntry[] {
  return getPublicSitemapEntries().filter((entry) => entry.featured)
}
