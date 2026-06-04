'use client'

import { useState } from 'react'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const digits = value.padEnd(6, ' ').slice(0, 6).split('')

  const handleChange = (index: number, char: string) => {
    const cleaned = char.replace(/\D/g, '').slice(-1)
    const next = digits.map((d, i) => (i === index ? cleaned : d === ' ' ? '' : d)).join('')
    onChange(next.replace(/\s/g, ''))
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
  }

  return (
    <div className="auth-otp-row" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className="auth-otp-cell apply-input"
          value={digit.trim()}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !digit.trim() && index > 0) {
              const prev = document.querySelector<HTMLInputElement>(
                `.auth-otp-cell:nth-child(${index})`
              )
              prev?.focus()
            }
          }}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  )
}
