/**
 * Business details used on legal / policy pages (Razorpay compliance).
 * Update these fields when your registration or contact info is final.
 */
export const BUSINESS = {
  tradingName: 'Togetha.Club',
  /** Legal entity name on Razorpay — update when registered */
  legalName: 'Togetha.Club',
  website: 'https://togetha.club',
  supportEmail: 'hello@togetha.club',
  grievanceEmail: 'hello@togetha.club',
  /** Add full registered address when available */
  registeredAddress: 'New Delhi, India',
  supportHours: 'Monday–Saturday, 10:00 AM – 7:00 PM IST',
  lastUpdated: '3 June 2026',
  refundProcessingDays: '5–7 business days',
  cancellationProcessingFeeInr: 999,
  slotBookingPercent: 30,
  /** Time to verify an applicant's profile after a slot booking */
  verificationWindow: '24–36 hours',
  /** Hours an approved applicant has to pay the remaining balance before the slot is released */
  balancePaymentWindowHours: 48,
  /** Percent of the booking amount retained if an approved applicant misses the balance window */
  lateForfeitPercent: 50,
  governingLaw: 'laws of India',
  governingCourts: 'courts at New Delhi',
  agentName: 'Sophie',
  whatsappUrl: 'https://wa.me/917054183391',
  whatsappDisplay: '+91 70541 83391',
  phoneUrl: 'tel:+917830910776',
  phoneDisplay: '+91 78309 10776',
  instagramUrl: 'https://ig.me/m/togetha.club',
  instagramHandle: '@togetha.club',
} as const
