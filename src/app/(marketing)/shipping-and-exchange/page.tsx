import LegalDocument from '@/components/legal/LegalDocument'
import { BUSINESS } from '@/config/business'
import { shippingSections } from '@/content/legal-policies'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata(
    'Shipping and Exchange — Togetha.Club',
    'Service delivery for Togetha.Club travel bookings — no physical shipping.'
  )
}

export default function ShippingPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Shipping and Exchange"
      intro={`${BUSINESS.tradingName} provides travel experiences, not physical products. This page describes how your booking is fulfilled digitally and on trip dates.`}
      sections={shippingSections}
      lastUpdated={BUSINESS.lastUpdated}
    />
  )
}
