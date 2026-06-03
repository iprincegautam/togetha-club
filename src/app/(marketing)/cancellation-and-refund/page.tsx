import LegalDocument from '@/components/legal/LegalDocument'
import { BUSINESS } from '@/config/business'
import { cancellationSections } from '@/content/legal-policies'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata(
    'Cancellation and Refund — Togetha.Club',
    'Cancellation windows, refund amounts, and timelines for Togetha.Club trip bookings.'
  )
}

export default function CancellationPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Cancellation and Refund Policy"
      intro="Clear rules for cancelling your trip, slot booking payments, transfers, and how refunds are processed."
      sections={cancellationSections}
      lastUpdated={BUSINESS.lastUpdated}
    />
  )
}
