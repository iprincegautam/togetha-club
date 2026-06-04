import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { GLYPH } from '@/constants/brand-glyphs'

type PortalBackLinkProps = {
  variant?: 'dark' | 'light'
  href?: string
  label?: string
  className?: string
}

export default function PortalBackLink({
  variant = 'light',
  href = ROUTES.home,
  label = 'Back to site',
  className = '',
}: PortalBackLinkProps) {
  return (
    <Link
      href={href}
      className={`portal-back-link portal-back-link--${variant}${className ? ` ${className}` : ''}`}
    >
      <span className="portal-back-glyph" aria-hidden>
        {GLYPH.arrow}
      </span>
      <span className="portal-back-label">{label}</span>
    </Link>
  )
}
