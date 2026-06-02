'use client'

import { useCallback } from 'react'

export function useSmoothScroll() {
  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return scrollTo
}
