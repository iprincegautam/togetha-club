'use client'

import { useCallback, useState } from 'react'
import type { BatchGallerySlide } from '@/constants/batch-gallery'

interface BatchVisualCarouselProps {
  slides: BatchGallerySlide[]
  accentColor?: string
}

export default function BatchVisualCarousel({ slides, accentColor = 'var(--teal)' }: BatchVisualCarouselProps) {
  const [index, setIndex] = useState(0)
  const count = slides.length

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % count) + count) % count)
    },
    [count]
  )

  const handleTouchStart = (startX: number) => {
    const onEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0]?.clientX ?? startX
      const delta = startX - endX
      if (Math.abs(delta) > 48) {
        setIndex((i) => (delta > 0 ? i + 1 : i - 1 + count) % count)
      }
    }
    window.addEventListener('touchend', onEnd, { once: true })
  }

  if (count === 0) return null

  const slide = slides[index]

  return (
    <div
      className="batch-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Trip gallery"
    >
      <div className="batch-carousel-viewport">
        <div
          className="batch-carousel-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map(({ id, caption, Visual }) => (
            <div className="batch-carousel-slide" key={id} aria-hidden={slides[index]?.id !== id}>
              <Visual />
              <p className="batch-carousel-caption">{caption}</p>
            </div>
          ))}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            className="batch-carousel-arrow batch-carousel-arrow-prev"
            aria-label="Previous image"
            onClick={() => goTo(index - 1)}
            style={{ borderColor: accentColor, color: accentColor }}
          >
            ←
          </button>
          <button
            type="button"
            className="batch-carousel-arrow batch-carousel-arrow-next"
            aria-label="Next image"
            onClick={() => goTo(index + 1)}
            style={{ borderColor: accentColor, color: accentColor }}
          >
            →
          </button>

          <div className="batch-carousel-dots" role="tablist" aria-label="Gallery slides">
            {slides.map(({ id, caption }, i) => (
              <button
                key={id}
                type="button"
                role="tab"
                className={`batch-carousel-dot${i === index ? ' active' : ''}`}
                aria-label={`Slide ${i + 1}: ${caption}`}
                aria-selected={i === index}
                onClick={() => setIndex(i)}
                style={i === index ? { background: accentColor, borderColor: accentColor } : undefined}
              />
            ))}
          </div>

          <div
            className="batch-carousel-swipe"
            aria-hidden
            onTouchStart={(e) => handleTouchStart(e.changedTouches[0]?.clientX ?? 0)}
          />
        </>
      )}
    </div>
  )
}
