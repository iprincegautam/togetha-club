import Link from 'next/link'
import WaitlistForm from '@/components/batches/WaitlistForm'
import { BATCH_META } from '@/constants/batches'
import { ROUTES } from '@/constants/routes'
import { buildMetadata } from '@/lib/metadata'
import '@/components/apply/apply.css'
import '@/components/batches/batches.css'

export function generateMetadata() {
  return buildMetadata(
    'Waitlist — Batch C | Togetha.Club',
    'Join the waitlist for the mystery August 2026 batch. 48-hour early access before public reveal.'
  )
}

export default function WaitlistPage() {
  const accentColor = BATCH_META['batch-c'].accentColor

  return (
    <div className="apply-page">
      <div className="apply-shell" style={{ maxWidth: 520 }}>
        <p className="apply-eyebrow" style={{ color: 'var(--lavender)' }}>
          ✦ August 2026 ✦
        </p>
        <h1 className="apply-title" style={{ color: 'var(--lavender)' }}>
          Join the waitlist.
        </h1>
        <p className="apply-sub">
          Batch C is a mystery destination dropping August 1st. Waitlist members get 48-hour early
          access before the public reveal.
        </p>

        <div className="apply-card batch-c-info">
          <div className="batch-c-details-box">
            <div className="batch-c-details-title">🔒 Details drop August 1st</div>
            <p className="batch-c-details-text">
              New route. Different format. Same magic. No commitment required to join the list.
            </p>
          </div>
          <WaitlistForm accentColor={accentColor} />
        </div>

        <p className="apply-foot">
          Already know which batch you want?{' '}
          <Link href={ROUTES.batches} style={{ color: 'var(--teal-stamp)' }}>
            Browse open batches →
          </Link>
        </p>
      </div>
    </div>
  )
}
