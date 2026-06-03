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
  governingLaw: 'laws of India',
  governingCourts: 'courts at New Delhi',
} as const
