'use client'

import { useEffect, useRef } from 'react'
import { trackPendingPurchaseOnConfirmationPage } from '@/lib/meta-pixel'

/** Backup Purchase fire on /confirmation (deduped via transaction_id). */
export default function ConfirmationConversionTracker() {
  const trackedRef = useRef(false)

  useEffect(() => {
    if (trackedRef.current) return
    trackedRef.current = true
    trackPendingPurchaseOnConfirmationPage()
  }, [])

  return null
}
