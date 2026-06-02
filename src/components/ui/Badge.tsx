import { cn } from '@/lib/utils'

type BadgeColor = 'teal' | 'rose' | 'gold' | 'lavender' | 'ink'

interface BadgeProps {
  children: React.ReactNode
  color?: BadgeColor
  className?: string
}

const colorClass: Record<BadgeColor, string> = {
  teal: 'badge-teal',
  rose: 'badge-rose',
  gold: 'badge-gold',
  lavender: 'badge-lavender',
  ink: 'badge-ink',
}

export default function Badge({
  children,
  color = 'teal',
  className,
}: BadgeProps) {
  return (
    <span className={cn('badge', colorClass[color], className)}>
      {children}
    </span>
  )
}
