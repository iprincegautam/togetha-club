'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { BatchVideoTestimonial } from '@/constants/batch-testimonials'

type BatchVideoTestimonialsProps = {
  items: BatchVideoTestimonial[]
  accentColor?: string
}

export default function BatchVideoTestimonials({
  items,
  accentColor = 'var(--teal-stamp)',
}: BatchVideoTestimonialsProps) {
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())
  const [playingId, setPlayingId] = useState<string | null>(null)

  const pauseAllExcept = useCallback((exceptId?: string) => {
    videoRefs.current.forEach((video, id) => {
      if (id !== exceptId && !video.paused) {
        video.pause()
      }
    })
  }, [])

  const togglePlay = useCallback(
    (id: string) => {
      const video = videoRefs.current.get(id)
      if (!video) return

      if (playingId === id && !video.paused) {
        video.pause()
        setPlayingId(null)
        return
      }

      pauseAllExcept(id)
      void video.play().then(() => setPlayingId(id)).catch(() => setPlayingId(null))
    },
    [pauseAllExcept, playingId]
  )

  useEffect(() => {
    const cleanups: Array<() => void> = []

    items.forEach((item) => {
      const el = videoRefs.current.get(item.id)
      if (!el) return

      const onEnd = () => setPlayingId((prev) => (prev === item.id ? null : prev))
      const onPause = () => setPlayingId((prev) => (prev === item.id ? null : prev))
      const onPlay = () => setPlayingId(item.id)

      el.addEventListener('ended', onEnd)
      el.addEventListener('pause', onPause)
      el.addEventListener('play', onPlay)
      cleanups.push(() => {
        el.removeEventListener('ended', onEnd)
        el.removeEventListener('pause', onPause)
        el.removeEventListener('play', onPlay)
      })
    })

    return () => cleanups.forEach((fn) => fn())
  }, [items])

  if (items.length === 0) return null

  return (
    <section className="batch-pdp-section batch-video-section" style={{ '--batch-accent': accentColor } as React.CSSProperties}>
      <div className="batch-pdp-section-head">
        <p className="batch-pdp-eyebrow">✦ Real stories ✦</p>
        <h2 className="batch-pdp-title">Hear it from them</h2>
        <p className="batch-pdp-sub">Swipe through video postcards from past travellers.</p>
      </div>

      <div className="batch-video-track" role="list">
        {items.map((item) => {
          const isPlaying = playingId === item.id
          return (
            <article key={item.id} className="batch-video-card" role="listitem">
              <div className="batch-video-frame">
                <video
                  ref={(el) => {
                    if (el) videoRefs.current.set(item.id, el)
                    else videoRefs.current.delete(item.id)
                  }}
                  className="batch-video-el"
                  src={item.src}
                  poster={item.poster}
                  playsInline
                  preload="metadata"
                  onClick={() => togglePlay(item.id)}
                />
                <button
                  type="button"
                  className={`batch-video-play${isPlaying ? ' playing' : ''}`}
                  onClick={() => togglePlay(item.id)}
                  aria-label={isPlaying ? `Pause ${item.title}` : `Play ${item.title}`}
                >
                  {isPlaying ? '❚❚' : '▶'}
                </button>
              </div>
              <div className="batch-video-caption">
                <strong>{item.title}</strong>
                <span>{item.subtitle}</span>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
