'use client'

import { useScrollReveal } from '@/hooks/useScrollReveal'
import { cn } from '@/lib/utils'

interface RevealProps {
  children: React.ReactNode
  className?: string
}

export default function Reveal({ children, className }: RevealProps) {
  const ref = useScrollReveal<HTMLDivElement>()

  return (
    <div ref={ref} className={cn('reveal', className)}>
      {children}
    </div>
  )
}
