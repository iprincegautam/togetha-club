import { cn } from '@/lib/utils'

interface StampCircleProps {
  text: React.ReactNode
  color?: string
  size?: number
  rotation?: number
  top?: number | string
  left?: number | string
  right?: number | string
  bottom?: number | string
  opacity?: number
  className?: string
}

export default function StampCircle({
  text,
  color = 'var(--teal-stamp)',
  size = 120,
  rotation = 0,
  top,
  left,
  right,
  bottom,
  opacity = 0.7,
  className,
}: StampCircleProps) {
  const positionedByClass = className?.includes('pc-')

  return (
    <div
      className={cn('postmark-circle', className)}
      style={{
        ...(positionedByClass ? {} : { width: size, height: size }),
        borderColor: color,
        color,
        ...(positionedByClass ? {} : { transform: `rotate(${rotation}deg)` }),
        top,
        left,
        right,
        bottom,
        opacity,
      }}
    >
      {text}
    </div>
  )
}
