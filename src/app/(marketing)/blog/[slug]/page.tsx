import { notFound } from 'next/navigation'
import Link from 'next/link'
import BlogArticle from '@/components/blog/BlogArticle'
import BlogJsonLd from '@/components/blog/BlogJsonLd'
import { ROUTES } from '@/constants/routes'
import { fetchBatchPricing } from '@/lib/batch-pricing'
import { getAllBlogPosts, getBlogPostBySlug, getBlogSlugs } from '@/lib/blog'
import { SITE_URL, buildMetadata } from '@/lib/metadata'
import '@/components/blog/blog.css'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getBlogSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)
  if (!post) return {}

  return buildMetadata(post.metaTitle, post.metaDescription)
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)
  if (!post) notFound()

  const needsPricing = post.sections.some((s) => s.type === 'live_pricing')
  const pricing = needsPricing ? await fetchBatchPricing() : undefined
  const pricingAsOf = needsPricing
    ? new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : undefined

  const url = `${SITE_URL}${ROUTES.blogPost(slug)}`
  const allPosts = getAllBlogPosts()
  const otherPosts = allPosts.filter((p) => p.slug !== slug).slice(0, 2)

  return (
    <div className="blog-page">
      <BlogJsonLd post={post} url={url} />
      <p className="blog-back">
        <Link href={ROUTES.blog}>← All articles</Link>
      </p>
      <BlogArticle post={post} pricing={pricing} pricingAsOf={pricingAsOf} />
      {otherPosts.length > 0 && (
        <aside className="blog-more">
          <h2 className="blog-h2">More from the journal</h2>
          <ul className="blog-more-list">
            {otherPosts.map((other) => (
              <li key={other.slug}>
                <Link href={ROUTES.blogPost(other.slug)}>{other.title}</Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  )
}
