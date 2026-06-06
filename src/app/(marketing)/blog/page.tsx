import BlogIndexList from '@/components/blog/BlogIndexList'
import { getBlogPostSummaries } from '@/lib/blog'
import { buildMetadata } from '@/lib/metadata'
import '@/components/blog/blog.css'

export function generateMetadata() {
  return buildMetadata(
    'Journal — Togetha.Club',
    'Guides on dating app alternatives, matchmaking travel clubs, and verified singles experiences in India.'
  )
}

export default function BlogIndexPage() {
  const posts = getBlogPostSummaries()

  return (
    <div className="blog-page">
      <BlogIndexList posts={posts} />
    </div>
  )
}
