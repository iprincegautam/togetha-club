import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'

interface SiteLogoProps {
  className?: string
  imageClassName?: string
  showWordmark?: boolean
  href?: string
}

export default function SiteLogo({
  className,
  imageClassName,
  showWordmark = true,
  href = ROUTES.home,
}: SiteLogoProps) {
  const mark = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png?v=2"
      alt=""
      className={cn('site-logo-img', imageClassName)}
      width={34}
      height={49}
      decoding="async"
    />
  )

  const content = (
    <>
      {mark}
      {showWordmark && <span className="site-logo-wordmark">Togetha.Club</span>}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={cn('site-logo anim-logo', className)} aria-label="Togetha.Club home">
        {content}
      </Link>
    )
  }

  return <div className={cn('site-logo', className)}>{content}</div>
}
