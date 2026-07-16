import { BUSINESS } from '@/config/business'
import type { LegalSection } from '@/components/legal/LegalDocument'

const B = BUSINESS

export const termsSections: LegalSection[] = [
  {
    title: '1. About us',
    paragraphs: [
      `${B.legalName} (“we”, “us”, “Togetha”) operates ${B.website}, a matchmaking travel club offering curated group trips in India for single adults.`,
      `By accessing the website, taking our compatibility quiz, applying for a batch, or making a payment, you agree to these Terms and Conditions.`,
    ],
  },
  {
    title: '2. Eligibility',
    list: [
      'You must be at least 18 years of age at the time of departure.',
      'You must complete our application and identity verification where requested.',
      'We reserve the right to approve or decline any applicant at our sole discretion to maintain group safety and fit.',
    ],
  },
  {
    title: '3. Bookings and payments',
    paragraphs: [
      `Trip prices are shown in Indian Rupees (INR) on the website. You may pay in full, or reserve a slot with a ${B.slotBookingPercent}% booking amount. After a slot booking we verify your profile within ${B.verificationWindow}. If approved, the remaining balance is due within ${B.balancePaymentWindowHours} hours of approval to confirm your spot. If the balance is not paid within this window, your slot is released and ${B.lateForfeitPercent}% of the booking amount is retained (${100 - B.lateForfeitPercent}% refunded).`,
      'Payments are processed securely via Razorpay. By paying, you authorise us to charge the selected amount and agree to Razorpay’s terms where applicable.',
      'A booking is confirmed only after successful payment and written confirmation from Togetha (email or on-site confirmation page).',
    ],
  },
  {
    title: '4. Application and conduct',
    list: [
      'Information you provide must be accurate. Misrepresentation may result in cancellation without refund.',
      'We maintain a zero-tolerance policy for harassment, discrimination, illegal activity, or behaviour that endangers others. Violators may be removed from a trip without refund.',
      'You are responsible for your own travel documents, insurance, and health fitness for high-altitude or outdoor activities where applicable.',
    ],
  },
  {
    title: '5. Trip changes',
    paragraphs: [
      'We may adjust itineraries, accommodation, or activities due to weather, safety, permits, or force majeure. We will seek the best reasonable alternative.',
      'If we cancel a batch entirely, you are entitled to a full refund of amounts paid for that booking, as described in our Cancellation and Refund Policy.',
    ],
  },
  {
    title: '6. Limitation of liability',
    paragraphs: [
      'To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from your participation in a trip.',
      'Our total liability for any claim relating to a specific booking shall not exceed the total amount you paid us for that booking.',
    ],
  },
  {
    title: '7. Governing law',
    paragraphs: [
      `These terms are governed by the ${B.governingLaw}. Disputes are subject to the exclusive jurisdiction of the ${B.governingCourts}.`,
    ],
  },
  {
    title: '8. Contact',
    paragraphs: [
      `Questions about these terms: ${B.supportEmail}. See also our Contact Us page.`,
    ],
  },
]

export const privacySections: LegalSection[] = [
  {
    title: '1. Who we are',
    paragraphs: [
      `${B.legalName} is the data controller for personal data collected through ${B.website} and related booking flows.`,
    ],
  },
  {
    title: '2. Data we collect',
    list: [
      'Identity and contact: name, email, phone number, gender (for spot allocation), date preferences.',
      'Quiz and application data: quiz answers, compatibility scores, batch preferences.',
      'Payment data: transaction IDs and payment status via Razorpay (we do not store full card or UPI credentials).',
      'Communications: emails we send and support messages you send us.',
      'Technical data: cookies, device/browser type, and analytics as described below.',
    ],
  },
  {
    title: '3. How we use your data',
    list: [
      'To process applications, payments, and trip confirmations.',
      'To operate waitlists, admin dashboards, and affiliate/promo programmes where applicable.',
      'To send service emails (confirmations, pre-trip information) and, with consent, marketing updates.',
      'To improve our website, safety screening, and group matching.',
      'To comply with law, prevent fraud, and enforce our terms.',
    ],
  },
  {
    title: '4. Sharing',
    paragraphs: [
      'We share data with service providers who help us run the platform, including Supabase (database/auth), Vercel (hosting), Razorpay (payments), and Resend (email), under appropriate contracts.',
      'We do not sell your personal data. We may disclose information if required by law or to protect rights and safety.',
    ],
  },
  {
    title: '5. Retention',
    paragraphs: [
      'We retain booking and application records for as long as needed to operate our business, resolve disputes, and meet legal obligations, then delete or anonymise where reasonable.',
    ],
  },
  {
    title: '6. Your rights',
    list: [
      'Request access, correction, or deletion of your personal data (subject to legal exceptions).',
      'Withdraw marketing consent at any time via unsubscribe or by emailing us.',
      'Lodge a complaint with the relevant data protection authority in India if you believe your rights are violated.',
    ],
  },
  {
    title: '7. Security',
    paragraphs: [
      'We use industry-standard measures including HTTPS, access controls, and secure payment processing. No method of transmission over the internet is 100% secure.',
    ],
  },
  {
    title: '8. Contact',
    paragraphs: [
      `Privacy requests: ${B.supportEmail}. Grievance / escalation: ${B.grievanceEmail}.`,
    ],
  },
]

export const cancellationSections: LegalSection[] = [
  {
    title: '1. Scope',
    paragraphs: [
      'This policy applies to all trip bookings made on Togetha.Club, including full payments and slot booking (partial) payments. Refunds are calculated on the amount you have actually paid.',
    ],
  },
  {
    title: '2. Cancellation by you',
    list: [
      `30 or more days before departure: refund of amount paid, minus ₹${B.cancellationProcessingFeeInr} processing fee.`,
      '15–29 days before departure: 50% refund of amount paid. You may transfer your spot to another applicant we approve.',
      'Under 15 days before departure: no refund. Spot transfer to another approved applicant may be allowed up to 7 days before departure, at our discretion.',
      'To cancel, email us at ' + B.supportEmail + ' with your name, batch, and payment reference.',
    ],
  },
  {
    title: '3. Slot booking (partial payment)',
    paragraphs: [
      `If you paid only the ${B.slotBookingPercent}% slot booking amount and later cancel, the same windows above apply to that payment. The remaining balance, if not yet paid, is simply not charged if you cancel within the applicable window.`,
      `If your profile is approved but you do not pay the remaining balance within ${B.balancePaymentWindowHours} hours of approval, your slot is released and ${B.lateForfeitPercent}% of the booking amount is retained; the remaining ${100 - B.lateForfeitPercent}% is refunded within ${B.refundProcessingDays}.`,
    ],
  },
  {
    title: '4. Verification failure',
    paragraphs: [
      `If identity or eligibility verification fails after payment, we will refund the full amount paid within ${B.refundProcessingDays}.`,
    ],
  },
  {
    title: '5. Cancellation by Togetha',
    list: [
      'If we cancel a batch: full refund of all amounts paid for that booking.',
      'If we remove you for conduct violations: no refund.',
    ],
  },
  {
    title: '6. Force majeure',
    paragraphs: [
      'If a trip cannot proceed due to events outside our reasonable control (e.g. natural disaster, government restriction), we will offer a rescheduled date or a full refund of amounts paid.',
    ],
  },
  {
    title: '7. Refund method and timeline',
    paragraphs: [
      'Approved refunds are returned to the original payment method via Razorpay where possible.',
      `Refunds are typically processed within ${B.refundProcessingDays} after approval. Bank/UPI timelines may add additional days.`,
    ],
  },
  {
    title: '8. Contact',
    paragraphs: [`Refund queries: ${B.supportEmail}.`],
  },
]

export const shippingSections: LegalSection[] = [
  {
    title: '1. No physical shipping',
    paragraphs: [
      `${B.tradingName} sells travel experiences and digital services only. We do not ship physical goods.`,
      'There is no delivery address, courier, or shipping fee for products.',
    ],
  },
  {
    title: '2. How your booking is fulfilled',
    list: [
      'After payment you receive on-screen confirmation and a confirmation email (when email delivery is configured).',
      'Pre-trip information (packing list, meet-up details, WhatsApp group access where applicable) is sent by email and digital channels before departure.',
      'The travel experience is delivered in person on the scheduled batch dates and location described on the website.',
    ],
  },
  {
    title: '3. “Exchange” of bookings',
    paragraphs: [
      'Trips cannot be exchanged for a different product like a retail store. You may request a spot transfer to another approved applicant or move to another batch only when we explicitly allow it in writing (see Cancellation and Refund Policy).',
    ],
  },
  {
    title: '4. Service issues',
    paragraphs: [
      `If you do not receive confirmation email within 48 hours of payment, contact ${B.supportEmail} with your payment ID.`,
    ],
  },
]
