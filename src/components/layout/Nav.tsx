'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import SiteLogo from '@/components/ui/SiteLogo'
import NavPortalMenu from '@/components/layout/NavPortalMenu'
import NavMenuIcon from '@/components/layout/NavMenuIcon'
import { ROUTES } from '@/constants/routes'
import { GLYPH } from '@/constants/brand-glyphs'

const NAV_ITEMS = [
  { href: ROUTES.howItWorks, label: 'How It Works' },
  { href: ROUTES.safety, label: 'Safety' },
  { href: ROUTES.match, label: 'Our AI' },
  { href: ROUTES.batches, label: 'Our Batches' },
  { href: ROUTES.blog, label: 'Journal' },
  { href: ROUTES.careers, label: 'Careers' },
] as const

const PORTAL_MOBILE_LINKS = [
  { href: ROUTES.accountLogin, label: 'My booking', glyph: GLYPH.heart },
  { href: ROUTES.accountSignup, label: 'Member signup', glyph: GLYPH.spark },
  { href: ROUTES.partnerLogin, label: 'Partner login', glyph: GLYPH.match },
  { href: ROUTES.partnerSignup, label: 'Claim partner', glyph: GLYPH.arrow },
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
      <nav className={scrolled ? 'site-nav scrolled' : 'site-nav'}>
        <SiteLogo className="nav-logo" imageClassName="nav-logo-img" />

        <ul className="nav-links">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>

        <div className="nav-end">
          <div className="nav-end-desktop">
            <NavPortalMenu />
          </div>

          <button
            type="button"
            className={`nav-menu-trigger${menuOpen ? ' open' : ''}`}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="nav-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <NavMenuIcon open={menuOpen} />
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

        <div className="nav-dropdown-portals">
          <p className="nav-dropdown-portals-eyebrow">
            {GLYPH.spark} Portals {GLYPH.spark}
          </p>
          <ul className="nav-dropdown-portals-links">
            {PORTAL_MOBILE_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={closeMenu}>
                  <span className="nav-dropdown-portal-glyph" aria-hidden>
                    {item.glyph}
                  </span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

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
