'use client'

interface DatePickerProps {
  options: { label: string; sublabel: string; soldOut?: boolean }[]
  value: number | null
  onChange: (index: number) => void
  accentColor: string
}

export default function DatePicker({
  options,
  value,
  onChange,
  accentColor,
}: DatePickerProps) {
  return (
    <div className="date-picker">
      <div className="date-picker-label">Select your departure date</div>
      <div className="date-options">
        {options.map((opt, index) => {
          const isSelected = value === index
          const classes = [
            'date-option',
            isSelected ? 'selected' : '',
            opt.soldOut ? 'sold-out' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <button
              key={opt.label}
              type="button"
              className={classes}
              disabled={opt.soldOut}
              onClick={() => !opt.soldOut && onChange(index)}
              style={
                isSelected
                  ? { borderColor: accentColor, background: `${accentColor}10` }
                  : undefined
              }
            >
              <div>
                <div className="date-info">{opt.label}</div>
                <div className="date-sub">{opt.sublabel}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
