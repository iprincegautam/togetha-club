'use client'

interface GenderSelectorProps {
  value: 'm' | 'f' | null
  onChange: (value: 'm' | 'f') => void
  maleLabel?: string
  femaleLabel?: string
  className?: string
}

export default function GenderSelector({
  value,
  onChange,
  maleLabel = 'A boy',
  femaleLabel = 'A girl',
  className,
}: GenderSelectorProps) {
  return (
    <div className={`gender-section${className ? ` ${className}` : ''}`}>
      <div className="gender-label">I am joining as</div>
      <div className="gender-options">
        <button
          type="button"
          className={`gender-btn${value === 'm' ? ' active-m' : ''}`}
          onClick={() => onChange('m')}
        >
          {maleLabel}
        </button>
        <button
          type="button"
          className={`gender-btn${value === 'f' ? ' active-f' : ''}`}
          onClick={() => onChange('f')}
        >
          {femaleLabel}
        </button>
      </div>
    </div>
  )
}
