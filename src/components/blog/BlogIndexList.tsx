import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import type { BlogPostSummary } from '@/types/blog'

type Props = {
  posts: BlogPostSummary[]
}

const FUNNEL_LABEL: Record<BlogPostSummary['funnel'], string> = {
  tofu: 'Guides',
  mofu: 'The club',
  bofu: 'Before you apply',
}

export default function BlogIndexList({ posts }: Props) {
  return (
    <div className="blog-index">
      <header className="blog-index-head">
        <p className="blog-eyebrow">✦ Togetha Journal</p>
        <h1 className="blog-title">Stories for singles who&apos;d rather show up</h1>
        <p className="blog-index-sub">
          Dating app fatigue, what a matchmaking travel club actually is, and honest answers before
          you apply — SEO-enriched guides from India&apos;s first experience-driven singles club.
        </p>
      </header>

      <div className="blog-card-grid">
        {posts.map((post) => (
          <article key={post.slug} className="blog-card">
            <p className="blog-card-tag">{FUNNEL_LABEL[post.funnel]}</p>
            <h2 className="blog-card-title">
              <Link href={ROUTES.blogPost(post.slug)}>{post.title}</Link>
            </h2>
            <p className="blog-card-excerpt">{post.excerpt}</p>
            <p className="blog-card-meta">
              {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            <Link href={ROUTES.blogPost(post.slug)} className="blog-card-link">
              Read article →
            </Link>
          </article>
        ))}
      </div>

      <div className="blog-index-cta">
        <p>Ready to pick a trail?</p>
        <Link href={ROUTES.batches} className="btn-p">
          Choose your destination →
        </Link>
      </div>
    </div>
  )
}
