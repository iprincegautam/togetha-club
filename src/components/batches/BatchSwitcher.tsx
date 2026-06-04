'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { BATCH_META } from '@/constants/batches'
import { ROUTES } from '@/constants/routes'
import { formatPrice } from '@/lib/utils'
import type { BatchCatalogRow } from '@/lib/batch-catalog'

type BatchSwitcherProps = {
  batches: BatchCatalogRow[]
  currentSlug: string
}

function statusLabel(status: BatchCatalogRow['status']): string {
  switch (status) {
    case 'open':
      return 'Open'
    case 'sold_out':
      return 'Sold out'
    case 'waitlist':
      return 'Waitlist'
    case 'coming_soon':
      return 'Coming soon'
    default:
      return status
  }
}

export default function BatchSwitcher({ batches, currentSlug }: BatchSwitcherProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const active = track.querySelector('.batch-switcher-card.active')
    if (active instanceof HTMLElement) {
      active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
    }
  }, [currentSlug])

  return (
    <nav className="batch-switcher" aria-label="Choose batch">
      <p className="batch-switcher-label">All batches — swipe to compare</p>
      <div className="batch-switcher-track" ref={trackRef} role="list">
        {batches.map((batch) => {
          const meta = BATCH_META[batch.slug as keyof typeof BATCH_META]
          const active = batch.slug === currentSlug
          const accent = meta?.color ?? 'var(--teal-stamp)'

          return (
            <Link
              key={batch.slug}
              href={ROUTES.batchDetail(batch.slug)}
              role="listitem"
              className={`batch-switcher-card${active ? ' active' : ''}`}
              style={{ '--batch-accent': accent } as React.CSSProperties}
              aria-current={active ? 'page' : undefined}
            >
              <span className="batch-switcher-edition">{meta?.label ?? batch.slug}</span>
              <span className="batch-switcher-name">
                {batch.slug === 'batch-a' && 'Love Trail — A'}
                {batch.slug === 'batch-b' && 'Love Trail — B'}
                {batch.slug === 'batch-c' && 'Mystery Edition'}
              </span>
              <span className="batch-switcher-meta">
                {batch.price != null ? formatPrice(batch.price) : 'TBA'} · {statusLabel(batch.status)}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
