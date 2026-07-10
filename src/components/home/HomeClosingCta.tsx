'use client'

import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { useScrollReveal } from '@/hooks/useScrollReveal'

export default function HomeClosingCta() {
  const ref = useScrollReveal<HTMLElement>()

  return (
    <section ref={ref} className="sec home-closing-sec reveal">
      <div className="sec-inner home-closing-inner">
        <h2 className="home-closing-title">
          Ready to find your <span className="t">batch?</span>
        </h2>
        <p className="home-closing-sub">
          Pick Himalayan or Udaipur first — then take the quiz to check your fit and lock a Friday.
        </p>
        <div className="home-closing-btns">
          <Link href={ROUTES.batches} className="btn-p">
            Choose your destination →
          </Link>
          <Link href={ROUTES.howItWorks} className="btn-o">
            How it works
          </Link>
        </div>
      </div>
    </section>
  )
}
