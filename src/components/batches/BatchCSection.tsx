import WaitlistForm from '@/components/batches/WaitlistForm'
import Reveal from '@/components/ui/Reveal'
import { BatchCBlurredVisual } from '@/components/batches/BatchVisuals'
import { BATCH_META } from '@/constants/batches'

import { CLUE_GLYPH } from '@/constants/brand-glyphs'

const BATCH_C_CLUES = [
  {
    icon: CLUE_GLYPH.water,
    title: 'Water is involved',
    desc: 'Not a beach. Not a river. Something between.',
  },
  {
    icon: CLUE_GLYPH.sunrise,
    title: 'The sunrise is the thing',
    desc: "There's a specific moment on Day 3 we're building the whole trip around.",
  },
  {
    icon: CLUE_GLYPH.format,
    title: 'A new format',
    desc: "Not just mountains. Not just bonfire. We're adding something we've never done before.",
  },
]

export default function BatchCSection() {
  const accentColor = BATCH_META['batch-c'].accentColor

  return (
    <>
      <div className="batch-section-header" id="batch-c">
        <div className="batch-label-pill lavender-pill">✦ Something new — August 2026</div>
        <h2 className="batch-section-title">
          A <em>third</em> destination.
          <br />
          Coming soon.
        </h2>
      </div>

      <div className="product-page">
        <Reveal className="product-card batch-c-card">
          <div className="product-hero batch-c-hero">
            <div className="product-visual">
              <div className="visual-blurred">
                <BatchCBlurredVisual />
              </div>
              <div className="coming-soon-overlay">
                <div className="coming-soon-stamp">
                  ✦ Coming
                  <br />
                  August 2026 ✦
                </div>
                <p className="coming-soon-text">
                  A new destination. A new format. A new kind of magic.
                </p>
              </div>
            </div>

            <div className="product-info batch-c-info">
              <div className="product-badges">
                <span className="badge badge-waitlist">✦ August 2026</span>
                <span className="badge badge-mystery">Mystery Destination</span>
              </div>

              <h1 className="product-title batch-c-title">
                The Himalayan
                <br />
                Love Trail — C
              </h1>
              <p className="product-tagline">
                <em>
                  &quot;We&apos;re not telling you where it is. We&apos;re just telling you it&apos;s
                  different. Sign up. Trust us.&quot;
                </em>
              </p>

              <div className="batch-c-details-box">
                <div className="batch-c-details-title">✦ Details drop August 1st</div>
                <p className="batch-c-details-text">
                  Waitlist members get 48-hour early access before public reveal. Expect: new route,
                  different format, same magic.
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div className="date-picker-label">Tentative dates</div>
                <div className="batch-c-tbd">
                  <div className="batch-c-tbd-date">August 2026 — TBD</div>
                  <div className="batch-c-tbd-sub">Two batches · 5 nights / 6 days</div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div className="date-picker-label">Expected investment</div>
                <div className="batch-c-price">₹???,???</div>
                <div className="batch-c-tbd-sub">Price revealed with details on Aug 1st</div>
              </div>

              <WaitlistForm accentColor={accentColor} />

              <div className="trust-row batch-c-trust">
                <span className="trust-item">
                  <span className="trust-check" style={{ color: accentColor }}>✓</span>
                  No commitment to join
                </span>
                <span className="trust-item">
                  <span className="trust-check" style={{ color: accentColor }}>✓</span>
                  First-access guaranteed
                </span>
                <span className="trust-item">
                  <span className="trust-check" style={{ color: accentColor }}>✓</span>
                  48 hrs before public
                </span>
              </div>
            </div>
          </div>

          <div className="batch-c-clues">
            <div className="section-label" style={{ color: 'var(--lavender)' }}>
              What we can tell you
            </div>
            <h2 className="batch-c-clues-title">Three clues. That&apos;s all you get.</h2>
            <div className="vibe-grid batch-c-clue-grid">
              {BATCH_C_CLUES.map((clue) => (
                <div className="vibe-card lavender" key={clue.title}>
                  <div className="vibe-icon brand-glyph">{clue.icon}</div>
                  <div className="vibe-title">{clue.title}</div>
                  <div className="vibe-desc">{clue.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </>
  )
}
