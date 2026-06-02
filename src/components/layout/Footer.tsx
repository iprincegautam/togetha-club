import Link from 'next/link'
import { ROUTES } from '@/constants/routes'

export default function Footer() {
  return (
    <footer>
      <div className="flogo">✈ Togetha.Club</div>
      <p className="ftag">
        India&apos;s first matchmaking travel club. Like Hinge, but for travelers.
      </p>
      <ul className="flinks">
        <li>
          <Link href={`${ROUTES.home}#how`}>How It Works</Link>
        </li>
        <li>
          <Link href={`${ROUTES.home}#ai`}>Our AI</Link>
        </li>
        <li>
          <Link href={`${ROUTES.batches}#batch-a`}>Batch A</Link>
        </li>
        <li>
          <Link href={`${ROUTES.batches}#batch-b`}>Batch B</Link>
        </li>
        <li>
          <Link href={`${ROUTES.home}#quiz`}>Take the Quiz</Link>
        </li>
        <li>
          <a href="https://instagram.com/togetha.club" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        </li>
        <li>
          <a href="#">WhatsApp</a>
        </li>
      </ul>
      <p className="fcopy">
        © 2026 Togetha.Club · Made with ♡ for people who believe in the real thing
      </p>
    </footer>
  )
}
