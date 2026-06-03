'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import SiteLogo from '@/components/ui/SiteLogo'
import { ROUTES } from '@/constants/routes'

const NAV_ITEMS = [
  { href: `${ROUTES.home}#how`, label: 'How It Works' },
  { href: `${ROUTES.home}#ai`, label: 'Our AI' },
  { href: ROUTES.batches, label: 'Our Batches' },
] as const

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <nav className={scrolled ? 'scrolled' : undefined}>
        <SiteLogo className="nav-logo" imageClassName="nav-logo-img" />

        <ul className="nav-links">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>

        <div className="nav-end">
          <button
            type="button"
            className="nav-hamburger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>

          <Link href={ROUTES.batches} className="nav-cta">
            Apply Now
          </Link>
        </div>
      </nav>

      <div
        className={`nav-dropdown${menuOpen ? ' open' : ''}`}
        id="nav-menu"
        role="navigation"
        aria-label="Main menu"
        aria-hidden={!menuOpen}
      >
        <ul className="nav-dropdown-links">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} onClick={closeMenu}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href={ROUTES.batches} className="nav-dropdown-cta" onClick={closeMenu}>
          Apply Now
        </Link>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="nav-dropdown-backdrop"
          aria-label="Close menu"
          onClick={closeMenu}
        />
      )}
    </>
  )
}
