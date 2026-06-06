import Link from 'next/link'
import SiteLogo from '@/components/ui/SiteLogo'
import { ROUTES } from '@/constants/routes'

export default function Footer() {
  return (
    <footer>
      <SiteLogo
        className="footer-logo"
        imageClassName="footer-logo-img"
        href={ROUTES.home}
        showWordmark={false}
      />
      <p className="ftag">
        India&apos;s first matchmaking travel club. Like Hinge, but for travelers.
      </p>
      <ul className="flinks">
        <li>
          <Link href={`${ROUTES.home}#how`}>How It Works</Link>
        </li>
        <li>
          <Link href={ROUTES.match}>Our AI</Link>
        </li>
        <li>
          <Link href={ROUTES.batchDetail('batch-a')}>Batch A</Link>
        </li>
        <li>
          <Link href={ROUTES.batchDetail('batch-b')}>Batch B</Link>
        </li>
        <li>
          <Link href={ROUTES.match}>Take the Quiz</Link>
        </li>
        <li>
          <a href="https://instagram.com/togetha.club" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        </li>
        <li>
          <Link href={ROUTES.accountLogin}>My booking</Link>
        </li>
        <li>
          <Link href={ROUTES.contact}>Contact</Link>
        </li>
      </ul>
      <ul className="flinks flinks-legal">
        <li>
          <Link href={ROUTES.terms}>Terms</Link>
        </li>
        <li>
          <Link href={ROUTES.privacy}>Privacy</Link>
        </li>
        <li>
          <Link href={ROUTES.cancellationRefund}>Refunds</Link>
        </li>
        <li>
          <Link href={ROUTES.shipping}>Shipping</Link>
        </li>
      </ul>
      <p className="fcopy">
        © 2026 Togetha.Club · Made with ♡ for people who believe in the real thing
      </p>
    </footer>
  )
}
