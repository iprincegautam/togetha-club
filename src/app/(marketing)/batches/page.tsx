import Link from 'next/link'
import BatchesCatalog from '@/components/batches/BatchesCatalog'
import StampCircle from '@/components/ui/StampCircle'
import { fetchDestinationCatalog } from '@/lib/destination-catalog'
import { ROUTES } from '@/constants/routes'
import { withPromoQuery } from '@/lib/promo'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata(
    'The Batches — Togetha.Club',
    'Choose your destination. Himalayan Love Trail or Udaipur & Kumbhar Ghat. GenZ and Millennial editions. 24 singles. Real connection.'
  )
}

type PageProps = { searchParams: Promise<{ promo?: string }> }

export default async function BatchesPage({ searchParams }: PageProps) {
  const { promo } = await searchParams
  const destinations = await fetchDestinationCatalog()

  return (
    <>
      <div className="page-hero">
        <StampCircle
          text={<>Togetha<br />Club<br />✦ 2026 ✦</>}
          rotation={-15}
          className="pc-1"
        />
        <StampCircle
          text={<>India&apos;s<br />First<br />♡ Love Trip</>}
          color="var(--teal-stamp)"
          size={100}
          rotation={12}
          className="pc-2"
        />

        <p className="page-hero-eyebrow">✦ Choose your adventure ✦</p>
        <h1 className="page-hero-title">
          <span className="teal">Pick your destination.</span>
          <br />
          <span className="rose">Meet your person.</span>
        </h1>
        <p className="page-hero-sub">
          Two destinations. GenZ and Millennial editions on each. Pick a trip — we&apos;ll take you to
          Our AI quiz to check fit and capture your details.
        </p>
        <div className="doodle-divider">~ ~ ♡ ~ ~</div>
      </div>

      <BatchesCatalog destinations={destinations} promoCode={promo} />

      <div className="batches-cta batches-cta--catalog">
        <div className="batches-cta-inner">
          <div className="batches-cta-eyebrow">✦ Ready? ✦</div>
          <h2 className="batches-cta-title">
            Found your destination?
            <br />
            <span className="gold">Take the AI quiz first.</span>
          </h2>
          <p className="batches-cta-sub">
            Quiz first, then pick your Friday and pay on the website to lock your slot.
          </p>
          <div className="batches-cta-btns">
            <Link
              href={withPromoQuery(ROUTES.matchForDestination('himalayan'), promo)}
              className="batches-cta-btn teal"
            >
              ✦ Himalayan — Check my fit
            </Link>
            <Link
              href={withPromoQuery(ROUTES.matchForDestination('udaipur'), promo)}
              className="batches-cta-btn rose"
            >
              ♡ Udaipur — Check my fit
            </Link>
          </div>
          <p className="batches-cta-foot">
            Invite only · Pay online · Identity verified · 12 women · 12 men
          </p>
        </div>
      </div>
    </>
  )
}
