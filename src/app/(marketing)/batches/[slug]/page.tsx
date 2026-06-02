import { redirect } from 'next/navigation'
import { buildMetadata } from '@/lib/metadata'

const VALID_SLUGS = ['batch-a', 'batch-b', 'batch-c']

export function generateMetadata() {
  return buildMetadata('Batches — Togetha.Club', 'View Himalayan love trail batches.')
}

export default async function BatchSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (VALID_SLUGS.includes(slug)) {
    redirect(`/batches#${slug}`)
  }

  redirect('/batches')
}
