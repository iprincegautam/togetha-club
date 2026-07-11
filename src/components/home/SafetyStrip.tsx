import Link from 'next/link'
import { ROUTES } from '@/constants/routes'

/** Above-the-fold trust anchor. Sits directly under the hero (primacy). */
const CHECKS = [
  'Government ID, checked by hand',
  'LinkedIn + socials cross-referenced',
  'Single-gender rooms',
  'Female trip leads',
  'Captains with you 24/7',
] as const

export default function SafetyStrip() {
  return (
    <section className="safety-strip reveal" aria-label="Safety and verification">
      <div className="safety-strip-inner">
        <p className="safety-strip-lead">
          <span className="safety-strip-mark" aria-hidden>
            ✦
          </span>
          Every person in your batch is verified by a{' '}
          <strong>real human — by hand.</strong>
        </p>

        <ul className="safety-strip-chips">
          {CHECKS.map((c) => (
            <li key={c} className="safety-strip-chip">
              <span className="safety-strip-tick" aria-hidden>
                ✓
              </span>
              {c}
            </li>
          ))}
        </ul>

        <div className="safety-strip-foot">
          <span className="safety-strip-refund">Can&apos;t verify you? Full refund.</span>
          <Link href={ROUTES.safety} className="safety-strip-cta">
            See who gets in →
          </Link>
        </div>
      </div>
    </section>
  )
}
