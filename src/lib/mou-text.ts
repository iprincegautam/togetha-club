export const MOU_VERSION = 'v1.0'

/** Togetha.Club Influencer / Partner Memorandum of Understanding */
export const MOU_CLAUSES: { num: number; title: string; body: string }[] = [
  {
    num: 1,
    title: 'Parties',
    body: 'This Memorandum of Understanding ("MOU") is between Togetha.Club ("Company") and the influencer/partner signing this agreement ("Partner").',
  },
  {
    num: 2,
    title: 'Purpose',
    body: 'Partner promotes Togetha.Club Himalayan love-trail batches using assigned promo codes and approved brand assets, in exchange for commissions and complimentary trip entitlements as per Company policy.',
  },
  {
    num: 3,
    title: 'Term',
    body: 'This MOU begins on the date of electronic signature and continues until terminated by either party with 14 days written notice via email to hello@togetha.club.',
  },
  {
    num: 4,
    title: 'Promo codes & tracking',
    body: 'Partner will use only Company-issued promo codes. All bookings must flow through official Togetha.Club apply links. Self-referrals and fraudulent traffic are prohibited.',
  },
  {
    num: 5,
    title: 'Commission',
    body: 'Commission amounts are set per promo code in the partner portal. Commissions become payable after booking confirmation and successful payment verification, subject to cancellation/refund policy.',
  },
  {
    num: 6,
    title: 'Content obligations',
    body: 'Partner agrees to deliver pre-trip, in-trip, and post-trip content per the content calendar. All posts must comply with ASCI guidelines including #Ad / #Collab disclosure and @togetha.club tagging where applicable.',
  },
  {
    num: 7,
    title: 'Complimentary trips',
    body: 'Eligible partners receive up to two complimentary batch slots per calendar year plus one registered plus-one guest per trip, subject to availability and admin approval.',
  },
  {
    num: 8,
    title: 'KYC & payouts',
    body: 'Partner must submit valid PAN and payout details before receiving cash commissions. Payouts process monthly on or after the 10th for confirmed commissions from the prior period.',
  },
  {
    num: 9,
    title: 'Tax (TDS)',
    body: 'Company may deduct TDS under Section 194J on cash commissions exceeding applicable thresholds and Section 194R on complimentary trip fair market value as per Indian tax law.',
  },
  {
    num: 10,
    title: 'Brand guidelines',
    body: 'Partner will not make false claims about destinations, safety, or matchmaking outcomes. All creative must be factually accurate and pre-approved where Company requests review.',
  },
  {
    num: 11,
    title: 'Confidentiality',
    body: 'Non-public pricing, batch capacity, and applicant data are confidential. Partner must not share applicant PII obtained through the portal.',
  },
  {
    num: 12,
    title: 'Termination',
    body: 'Company may suspend or terminate this MOU immediately for fraud, ASCI violations, harassment, or material breach. Unpaid confirmed commissions for valid bookings will still be honoured.',
  },
  {
    num: 13,
    title: 'Limitation of liability',
    body: 'Company liability is limited to unpaid confirmed commissions. Partner participates in trips at their own risk subject to trip terms and conditions.',
  },
  {
    num: 14,
    title: 'Governing law',
    body: 'This MOU is governed by the laws of India. Disputes are subject to courts in New Delhi. Electronic signature constitutes binding acceptance.',
  },
]

export function mouFullText(): string {
  return MOU_CLAUSES.map((c) => `${c.num}. ${c.title}\n${c.body}`).join('\n\n')
}
