import LegalDocument from '@/components/legal/LegalDocument'
import { BUSINESS } from '@/config/business'
import { privacySections } from '@/content/legal-policies'
import { buildMetadata } from '@/lib/metadata'

export function generateMetadata() {
  return buildMetadata(
    'Privacy Policy — Togetha.Club',
    'How Togetha.Club collects, uses, and protects your personal information.'
  )
}

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Privacy Policy"
      intro={`We respect your privacy. This policy explains what data we collect when you use ${BUSINESS.website} and how we handle it.`}
      sections={privacySections}
      lastUpdated={BUSINESS.lastUpdated}
    />
  )
}
