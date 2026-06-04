import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { GLYPH } from '@/constants/brand-glyphs'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata('Payment Methods — Togetha.Club', 'Saved cards for balance payments.')
}

export default function AccountPaymentsPage() {
  return (
    <div className="account-stack">
      <div className="account-panel">
        <p className="apply-eyebrow">{GLYPH.spark} Payments {GLYPH.spark}</p>
        <h1 className="account-title">Saved cards</h1>
        <p className="account-sub">
          Coming soon — save a card when you pay your trip balance so checkout is faster next time.
        </p>
        <p className="account-muted">
          For now, pay your balance from{' '}
          <Link href={ROUTES.account}>My booking</Link> using Razorpay at checkout (UPI, card, netbanking).
        </p>
        <p className="account-foot" style={{ marginTop: 24 }}>
          <Link href={ROUTES.accountSettings} className="admin-inline-link">
            ← Account settings
          </Link>
        </p>
      </div>
    </div>
  )
}
