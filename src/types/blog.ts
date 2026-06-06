export type BlogFunnel = 'tofu' | 'mofu' | 'bofu'

export interface BlogFaqItem {
  question: string
  answer: string
}

export type BlogSection =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | {
      type: 'table'
      caption?: string
      headers: string[]
      rows: string[][]
    }
  | { type: 'callout'; text: string }
  | { type: 'live_pricing' }
  | { type: 'cta'; label: string; href: string; secondary?: { label: string; href: string } }

export interface BlogPost {
  slug: string
  title: string
  metaTitle: string
  metaDescription: string
  excerpt: string
  publishedAt: string
  updatedAt: string
  author: string
  funnel: BlogFunnel
  primaryKeyword: string
  secondaryKeywords: string[]
  faq: BlogFaqItem[]
  socialHooks: string[]
  carouselOutline: string
  sections: BlogSection[]
}

export interface BlogPostSummary {
  slug: string
  title: string
  excerpt: string
  publishedAt: string
  funnel: BlogFunnel
  primaryKeyword: string
}
