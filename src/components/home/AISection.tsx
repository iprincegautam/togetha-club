'use client'

import { useScrollReveal } from '@/hooks/useScrollReveal'

const TRAITS = [
  { emoji: '🧠', label: 'Personality type' },
  { emoji: '💬', label: 'Communication style' },
  { emoji: '❤️', label: 'Love language' },
  { emoji: '🌍', label: 'Life values & dreams' },
  { emoji: '😂', label: 'Humour compatibility' },
  { emoji: '🎯', label: 'Ambition alignment' },
  { emoji: '🌙', label: 'Energy & pace of life' },
  { emoji: '🎭', label: 'Conflict style' },
] as const

export default function AISection() {
  const ref = useScrollReveal<HTMLElement>()

  return (
    <section ref={ref} className="ai-sec reveal" id="ai">
      <div className="ai-inner">
        <div className="ai-grid">
          <div>
            <div className="ai-label">✦ Our Secret Ingredient</div>
            <h2 className="ai-title">
              Our AI picks your
              <br />
              <span className="g">24 batchmates.</span>
              <br />
              Not randomly.
            </h2>
            <p className="ai-body">
              Every applicant fills a 10-question compatibility quiz — personality, values,
              communication style, love language, dreams, and the weird stuff nobody asks on
              dating apps. Our matching algorithm then builds each batch of 24 to maximise the
              probability of genuine connection, not just surface-level attraction.
            </p>
            <p className="ai-body">
              We don&apos;t just look at who you are. We look at who you need to be around.
            </p>
            <div className="ai-traits">
              {TRAITS.map((trait) => (
                <div key={trait.label} className="tp">
                  <span>{trait.emoji}</span> {trait.label}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="big-stat-wrap">
              <div className="big-pct">60%</div>
              <div className="big-lbl">
                of our travellers report their
                <br />
                relationship status changing
                <br />
                within 3 months of the trip.
              </div>
              <div className="big-sub">
                Based on post-trip surveys from our 2025 pilot batches.
              </div>
            </div>
            <div className="ai-note">
              <div className="ai-note-title">How the algorithm works</div>
              <div className="ai-note-body">
                Your quiz answers are converted into a 12-dimension compatibility vector. We
                run a constrained optimisation across all approved applicants to form a batch
                where average pairwise compatibility is maximised — while maintaining exact
                12M/12F balance.
              </div>
              <div className="ai-note-foot">
                Result: you don&apos;t meet 23 random people. You meet 23 people our system
                thinks you&apos;ll actually connect with.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
