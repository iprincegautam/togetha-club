'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={scrolled ? 'scrolled' : undefined}>
      <Link href={ROUTES.home} className="nav-logo">
        ✈ Togetha.Club
      </Link>

      <ul className="nav-links">
        <li>
          <Link href={`${ROUTES.home}#how`}>How It Works</Link>
        </li>
        <li>
          <Link href={ROUTES.batches}>The Batches</Link>
        </li>
        <li>
          <Link href={`${ROUTES.home}#ai`}>Our AI</Link>
        </li>
      </ul>

      <button type="button" className="nav-hamburger" aria-label="Open menu">
        ☰
      </button>

      <Link href={ROUTES.batches} className="nav-cta">
        Apply Now
      </Link>
    </nav>
  )
}
