import Link from 'next/link'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children: React.ReactNode
  onClick?: () => void
  href?: string
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-p',
  outline: 'btn-o',
  ghost: 'btn-ghost',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  onClick,
  href,
  disabled,
  loading,
  type = 'button',
}: ButtonProps) {
  const classes = cn(variantClass[variant], sizeClass[size], className)
  const isDisabled = disabled || loading
  const content = loading ? '...' : children

  if (href && !isDisabled) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={isDisabled}
    >
      {content}
    </button>
  )
}
