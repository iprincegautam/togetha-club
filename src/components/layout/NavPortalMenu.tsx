'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { GLYPH } from '@/constants/brand-glyphs'

const PORTAL_LINKS = [
  {
    href: ROUTES.accountLogin,
    label: 'My booking',
    sub: 'Members — track trip & pay balance',
    glyph: GLYPH.heart,
  },
  {
    href: ROUTES.accountSignup,
    label: 'Create member account',
    sub: 'Email verification',
    glyph: GLYPH.spark,
  },
  {
    href: ROUTES.partnerLogin,
    label: 'Partner login',
    sub: 'Influencers — promos & earnings',
    glyph: GLYPH.match,
  },
  {
    href: ROUTES.partnerSignup,
    label: 'Claim partner portal',
    sub: 'For invited partners',
    glyph: GLYPH.arrow,
  },
] as const

export default function NavPortalMenu() {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="nav-portal-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`nav-portal-trigger${open ? ' open' : ''}`}
        aria-label="Open portal menu"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="nav-portal-glyph" aria-hidden>
          {GLYPH.match}
        </span>
        <span className="nav-portal-label">Portal</span>
        <span className="nav-portal-chevron" aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>

      <div
        id={panelId}
        className={`nav-portal-panel${open ? ' open' : ''}`}
        role="menu"
        aria-hidden={!open}
      >
        <p className="nav-portal-panel-eyebrow">
          {GLYPH.spark} Sign in {GLYPH.spark}
        </p>
        <ul className="nav-portal-panel-links">
          {PORTAL_LINKS.map((item) => (
            <li key={item.href} role="none">
              <Link
                href={item.href}
                role="menuitem"
                className="nav-portal-panel-link"
                onClick={() => setOpen(false)}
              >
                <span className="nav-portal-panel-glyph" aria-hidden>
                  {item.glyph}
                </span>
                <span className="nav-portal-panel-text">
                  <span className="nav-portal-panel-title">{item.label}</span>
                  <span className="nav-portal-panel-sub">{item.sub}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
