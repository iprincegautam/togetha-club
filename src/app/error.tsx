'use client'

import './system-pages.css'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="system-page">
      <div className="system-page-inner">
        <div className="system-page-icon">⚠</div>
        <p className="system-page-eyebrow">✦ Oops ✦</p>
        <h1 className="system-page-title">Something went sideways.</h1>
        <p className="system-page-text">
          The mountains are unpredictable — and so is software sometimes. Give it another shot.
        </p>
        <button type="button" className="system-page-btn" onClick={reset}>
          Try again →
        </button>
      </div>
    </div>
  )
}
