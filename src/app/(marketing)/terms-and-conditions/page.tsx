import LegalDocument from '@/components/legal/LegalDocument'
import { BUSINESS } from '@/config/business'
import { termsSections } from '@/content/legal-policies'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata(
    'Terms and Conditions — Togetha.Club',
    'Terms governing bookings, payments, and participation in Togetha.Club travel experiences.'
  )
}

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Terms and Conditions"
      intro={`These terms govern your use of ${BUSINESS.website} and bookings with ${BUSINESS.tradingName}. Please read them before applying or paying.`}
      sections={termsSections}
      lastUpdated={BUSINESS.lastUpdated}
    />
  )
}
