import Link from 'next/link'
import { ROUTES } from '@/constants/routes'

export default function HowItWorksHero() {
  return (
    <section className="hiw-hero">
      <div className="hiw-hero-inner">
        <p className="hiw-hero-eyebrow">✦ How It Works ✦</p>
        <h1 className="hiw-hero-title">
          Quiz → match → <span className="hiw-hero-accent">mountains.</span>
        </h1>
        <p className="hiw-hero-sub">
          The full process — screening, AI batching, the 6-day route, and what actually happens
          when 24 verified singles show up together.
        </p>
        <div className="hiw-hero-btns">
          <Link href={ROUTES.match} className="btn-p">
            Take the Quiz →
          </Link>
          <Link href={ROUTES.batches} className="btn-o">
            See open batches
          </Link>
        </div>
      </div>
    </section>
  )
}
