import Link from 'next/link'
import { BUSINESS } from '@/config/business'
import { ROUTES } from '@/constants/routes'
import { buildMetadata } from '@/lib/metadata'
import '@/components/legal/legal.css'

export function generateMetadata() {
  return buildMetadata(
    'Contact Us — Togetha.Club',
    'Get in touch with Togetha.Club for bookings, refunds, and support.'
  )
}

export default function ContactPage() {
  return (
    <div className="legal-page">
      <div className="legal-shell">
        <p className="legal-eyebrow">Support</p>
        <h1 className="legal-title">Contact Us</h1>
        <p className="legal-updated">Last updated: {BUSINESS.lastUpdated}</p>
        <p className="legal-intro">
          We&apos;re here for application questions, payments, cancellations, and trip support. Reach
          us using the details below — we aim to reply within one business day.
        </p>

        <dl className="contact-card">
          <dt>Business name</dt>
          <dd>{BUSINESS.tradingName}</dd>

          <dt>Website</dt>
          <dd>
            <a href={BUSINESS.website}>{BUSINESS.website}</a>
          </dd>

          <dt>Email</dt>
          <dd>
            <a href={`mailto:${BUSINESS.supportEmail}`}>{BUSINESS.supportEmail}</a>
          </dd>

          <dt>Grievance / escalations</dt>
          <dd>
            <a href={`mailto:${BUSINESS.grievanceEmail}`}>{BUSINESS.grievanceEmail}</a>
          </dd>

          <dt>Registered address</dt>
          <dd>{BUSINESS.registeredAddress}</dd>

          <dt>Support hours</dt>
          <dd>{BUSINESS.supportHours}</dd>
        </dl>

        <div className="legal-body">
          <section className="legal-section">
            <h2>What to include in your message</h2>
            <ul>
              <li>Full name and email used at checkout</li>
              <li>Batch name (e.g. Himalayan Love Trail — GenZ Edition)</li>
              <li>Razorpay payment ID or order ID, if applicable</li>
              <li>Short description of your request (refund, transfer, technical issue)</li>
            </ul>
          </section>
          <section className="legal-section">
            <h2>Related policies</h2>
            <ul>
              <li>
                <Link href={ROUTES.cancellationRefund}>Cancellation and Refund</Link>
              </li>
              <li>
                <Link href={ROUTES.terms}>Terms and Conditions</Link>
              </li>
              <li>
                <Link href={ROUTES.privacy}>Privacy Policy</Link>
              </li>
            </ul>
          </section>
        </div>

        <p className="legal-foot">
          <Link href={ROUTES.home}>← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
