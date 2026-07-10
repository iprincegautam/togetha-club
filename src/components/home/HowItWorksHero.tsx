import Link from 'next/link'
import { ROUTES } from '@/constants/routes'

export default function HowItWorksHero() {
  return (
    <section className="hiw-hero">
      <div className="hiw-hero-inner">
        <p className="hiw-hero-eyebrow">✦ How It Works ✦</p>
        <h1 className="hiw-hero-title">
          Quiz → book → <span className="hiw-hero-accent">mountains.</span>
        </h1>
        <p className="hiw-hero-sub">
          Take the quiz, pick your Friday, pay on the website — then show up with 12 women and 12
          men for 3 nights across Manali, Sissu, and Kasol.
        </p>
        <div className="hiw-hero-btns">
          <Link href={ROUTES.batches} className="btn-p">
            Choose your destination →
          </Link>
          <Link href={ROUTES.batches} className="btn-o">
            See open batches
          </Link>
        </div>
      </div>
    </section>
  )
}
