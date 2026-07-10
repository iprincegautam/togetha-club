import {
  BOOKABLE_BATCH_SLUGS,
  DESTINATIONS,
  type DestinationSlug,
  getEditionSlugsForDestination,
} from '@/constants/destinations'
import { fetchBatchesCatalog, type BatchCatalogRow } from '@/lib/batch-catalog'

export type DestinationCatalogRow = {
  slug: DestinationSlug
  title: string
  stops: string
  duration: string
  tagline: string
  ageSummary: string
  accentColor: string
  catalogCardClass: string
  startingPrice: number | null
  status: 'open' | 'sold_out' | 'waitlist' | 'coming_soon'
  editions: BatchCatalogRow[]
}

function aggregateDestinationStatus(
  editions: BatchCatalogRow[]
): DestinationCatalogRow['status'] {
  if (editions.some((e) => e.status === 'open')) return 'open'
  if (editions.some((e) => e.status === 'waitlist')) return 'waitlist'
  if (editions.some((e) => e.status === 'sold_out')) return 'sold_out'
  return 'coming_soon'
}

export async function fetchDestinationCatalog(): Promise<DestinationCatalogRow[]> {
  const batches = await fetchBatchesCatalog()
  const batchMap = new Map(batches.map((batch) => [batch.slug, batch]))

  return (Object.keys(DESTINATIONS) as DestinationSlug[]).map((destinationSlug) => {
    const meta = DESTINATIONS[destinationSlug]
    const editionSlugs = getEditionSlugsForDestination(destinationSlug)
    const editions = editionSlugs
      .map((slug) => batchMap.get(slug))
      .filter((batch): batch is BatchCatalogRow => Boolean(batch))

    const openPrices = editions
      .map((e) => e.price)
      .filter((price): price is number => price != null)

    return {
      slug: destinationSlug,
      title: meta.title,
      stops: meta.stops,
      duration: meta.duration,
      tagline: meta.tagline,
      ageSummary: meta.ageSummary,
      accentColor: meta.accentColor,
      catalogCardClass: meta.catalogCardClass,
      startingPrice: openPrices.length ? Math.min(...openPrices) : null,
      status: aggregateDestinationStatus(editions),
      editions,
    }
  })
}

export function getBookableBatchesFromCatalog(
  batches: BatchCatalogRow[]
): BatchCatalogRow[] {
  return BOOKABLE_BATCH_SLUGS.map((slug) => batches.find((b) => b.slug === slug)).filter(
    (batch): batch is BatchCatalogRow => Boolean(batch)
  )
}
