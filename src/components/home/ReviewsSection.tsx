'use client'

import SectionLabel from '@/components/ui/SectionLabel'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const REVIEWS = [
  {
    quote: '"',
    text: 'I was the most skeptical person there. Told my roommate this was going to be cringe. By day 3 I was crying at a bonfire because someone finally got what I was saying. No cap.',
    initials: 'AK',
    avatarClass: 'av-t',
    name: 'Aryan K., 24 · Delhi',
    sub: "Batch A Pilot '25",
  },
  {
    quote: '"',
    text: "Day 5 at Sissu Lake. She'd mentioned something on Day 2 I'd been thinking about for three days. I finally said it. She cried. Good crying. We're figuring things out — 4 months later.",
    initials: 'AM',
    avatarClass: 'av-r',
    name: 'Abhishek M., 31 · Delhi',
    sub: "Batch B Pilot '25",
  },
  {
    quote: '"',
    text: "The letter exchange wrecked me in a good way. Didn't connect romantically — but someone wrote me the most honest, kind thing I've read in years. Still on my desk.",
    initials: 'NK',
    avatarClass: 'av-g',
    name: 'Neha K., 30 · Mumbai',
    sub: "Batch B Pilot '25",
  },
] as const

export default function ReviewsSection() {
  const ref = useScrollReveal<HTMLElement>()

  return (
    <section ref={ref} className="sec reviews-sec reveal">
      <div className="sec-inner">
        <SectionLabel>Early Stories</SectionLabel>
        <h2 className="sec-title">
          They were <span className="r">skeptical</span> too.
        </h2>
        <p className="sec-sub">From our 2025 pilot batches.</p>
        <div className="reviews-grid">
          {REVIEWS.map((review) => (
            <div key={review.initials} className="rc">
              <div className="rq">{review.quote}</div>
              <div className="rt">{review.text}</div>
              <div className="ra">
                <div className={`av ${review.avatarClass}`}>{review.initials}</div>
                <div>
                  <div className="rn">{review.name}</div>
                  <div className="rs">{review.sub}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
