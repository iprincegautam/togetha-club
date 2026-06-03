'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/** Sections that should scroll-reveal (skip if already `.reveal`). */
const REVEAL_SELECTORS = [
  '.page-hero',
  '.batch-section-header',
  '.sep',
  '.batches-cta',
  '.apply-shell',
  '.confirm-shell',
  '.admin-page .admin-card',
  '.quiz-sec',
  '.mq-wrap',
]

export default function SiteMotion({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'))
      return
    }

    const seen = new Set<Element>()
    const targets: Element[] = []

    const addTarget = (el: Element) => {
      if (seen.has(el)) return
      seen.add(el)
      targets.push(el)
    }

    REVEAL_SELECTORS.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (!el.classList.contains('reveal')) addTarget(el)
      })
    })

    document.querySelectorAll('.reveal').forEach(addTarget)

    let index = 0
    targets.forEach((el) => {
      el.classList.add('reveal')
      ;(el as HTMLElement).style.setProperty(
        '--reveal-delay',
        `${Math.min(index * 0.07, 0.42)}s`
      )
      index += 1
    })

    const show = (el: Element) => el.classList.add('visible')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) show(entry.target)
        })
      },
      { threshold: 0.06, rootMargin: '0px 0px -36px 0px' }
    )

    targets.forEach((el) => {
      observer.observe(el)
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight * 0.94 && rect.bottom > 0) {
        show(el)
      }
    })

    return () => observer.disconnect()
  }, [pathname])

  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  )
}
