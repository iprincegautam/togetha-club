'use client'

import SectionLabel from '@/components/ui/SectionLabel'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'

const STATS = [
  {
    num: '24',
    numClass: '',
    label: (
      <>
        <strong>Screened singles per batch</strong>
        <br />
        12 boys · 12 girls · always balanced.
      </>
    ),
  },
  {
    num: '2',
    numClass: '',
    label: (
      <>
        <strong>Batches every month</strong>
        <br />
        GenZ edition &amp; Millennial edition.
      </>
    ),
  },
  {
    num: '6',
    numClass: '',
    label: (
      <>
        <strong>Days in the Himalayas</strong>
        <br />
        Manali · Kasol · Sissu.
      </>
    ),
  },
  {
    num: '60',
    numClass: 'sc-num-rose',
    suffix: <span className="sc-num-pct">%</span>,
    label: (
      <>
        <strong>Chance your relationship status changes</strong>
        <br />
        AI matching + verified data from pilot batches.
      </>
    ),
  },
] as const

export default function ConceptSection() {
  const ref = useScrollReveal<HTMLElement>()
  const scrollTo = useSmoothScroll()

  return (
    <section ref={ref} className="sec reveal" id="concept">
      <div className="sec-inner">
        <div className="concept-grid">
          <div>
            <SectionLabel>The Idea</SectionLabel>
            <h2 className="sec-title">
              Travel is the best
              <br />
              <span className="t">first date</span> you&apos;ll
              <br />
              never plan.
            </h2>
            <p className="sec-sub">
              Dating apps give you a photo and a 3-line bio. We give you 6 days in the
              Himalayas with 23 interesting, AI-matched, verified singles who all showed up
              for the same reason. If there&apos;s a spark, you&apos;ll know it — and
              it&apos;ll be real.
            </p>
            <button type="button" className="btn-p" onClick={() => scrollTo('quiz')}>
              ✦ Start the Quiz →
            </button>
          </div>
          <div className="stat-cards">
            {STATS.map((stat) => (
              <div key={stat.num} className="sc">
                <div className={`sc-num ${stat.numClass}`}>
                  {stat.num}
                  {'suffix' in stat && stat.suffix}
                </div>
                <div className="sc-lbl">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
