import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import './system-pages.css'

export default function NotFound() {
  return (
    <div className="system-page">
      <div className="system-page-inner">
        <div className="system-page-icon">🥾</div>
        <p className="system-page-eyebrow">✦ Lost ✦</p>
        <h1 className="system-page-title">Looks like this page wandered off the trail.</h1>
        <p className="system-page-text">
          Wrong turn somewhere in the Himalayas. Let&apos;s get you back to familiar ground.
        </p>
        <Link href={ROUTES.home} className="system-page-btn">
          ← Back home
        </Link>
      </div>
    </div>
  )
}
