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
          Two minutes on the quiz. One week in the mountains. Start with compatibility — we handle
          the rest.
        </p>
        <div className="home-closing-btns">
          <Link href={ROUTES.match} className="btn-p">
            Take the Compatibility Quiz →
          </Link>
          <Link href={ROUTES.howItWorks} className="btn-o">
            How it works
          </Link>
        </div>
      </div>
    </section>
  )
}
