import { redirect } from 'next/navigation'
import AccountItineraryPage from '@/components/account/AccountItineraryPage'
import { getMemberContext } from '@/lib/auth/member'
import { ROUTES } from '@/constants/routes'
import { buildMetadata } from '@/lib/metadata'
import type { MatchableBatchSlug } from '@/types/match'

export const metadata = buildMetadata(
  'Itinerary — Togetha.Club',
  'Your full day-by-day trip itinerary, inclusions, and exclusions.'
)

function resolveBatchSlug(raw: string | null | undefined): MatchableBatchSlug {
  return raw === 'batch-b' ? 'batch-b' : 'batch-a'
}

export default async function AccountItineraryRoute() {
  const ctx = await getMemberContext()
  if (!ctx.session) {
    redirect(`${ROUTES.accountLogin}?next=${ROUTES.accountItinerary}`)
  }

  const batchSlug = resolveBatchSlug(ctx.applicant?.batch_slug)
  const batches = ctx.applicant?.batches as { name?: string | null } | null | undefined
  const batchName = batches?.name ?? null

  return <AccountItineraryPage batchSlug={batchSlug} batchName={batchName} />
}
