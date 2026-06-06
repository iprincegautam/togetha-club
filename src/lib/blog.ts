import { BLOG_POSTS } from '@/content/blog/posts'
import type { BlogPost, BlogPostSummary } from '@/types/blog'

export function getAllBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}

export function getBlogPostSummaries(): BlogPostSummary[] {
  return getAllBlogPosts().map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    funnel: post.funnel,
    primaryKeyword: post.primaryKeyword,
  }))
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug)
}

export function getBlogSlugs(): string[] {
  return BLOG_POSTS.map((post) => post.slug)
}
