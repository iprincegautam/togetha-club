import Link from 'next/link'
import { BUSINESS } from '@/config/business'
import { ROUTES } from '@/constants/routes'
import { buildMetadata } from '@/lib/metadata'
import '@/components/legal/legal.css'

export function generateMetadata() {
  return buildMetadata(
    'About Togetha.Club — Matchmaking Travel Club',
    'Founded as an experience-driven matchmaking travel club for verified singles across India — people are the product, the trip is the context.'
  )
}

export default function AboutPage() {
  return (
    <div className="legal-page">
      <div className="legal-shell">
        <p className="legal-eyebrow">About us</p>
        <h1 className="legal-title">Togetha.Club</h1>
        <p className="legal-updated">India&apos;s first matchmaking travel club</p>

        <p className="legal-intro">
          {BUSINESS.tradingName} is not a travel package company. We are an experience-driven
          matchmaking travel club for verified singles who want real connection — not another swipe
          session. The people are the product; the Himalayan batch is the context where chemistry
          actually has room to happen.
        </p>

        <section className="legal-section">
          <h2>What we do</h2>
          <p>
            Every month we run curated batches — GenZ (18–25) and Millennial (26–36) editions — with
            balanced cohorts, AI compatibility matching, and 5 nights across Manali, Sissu, and
            Kasol. Take the quiz, book your slot, pay online, and show up.
          </p>
        </section>

        <section className="legal-section">
          <h2>Where we&apos;re headed</h2>
          <p>
            Himachal is live today. Uttarakhand, J&amp;K, Rajasthan, the Northeast, and festival-led
            lifestyle editions are on the roadmap — always with the same promise: verified singles,
            intentional matching, and trips built for connection.
          </p>
        </section>

        <section className="legal-section">
          <h2>Explore</h2>
          <ul>
            <li>
              <Link href={ROUTES.batches}>Upcoming batches &amp; pricing</Link>
            </li>
            <li>
              <Link href={ROUTES.match}>Take the AI match quiz</Link>
            </li>
            <li>
              <Link href={ROUTES.blog}>Read the Journal</Link>
            </li>
            <li>
              <Link href={ROUTES.contact}>Contact the team</Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
