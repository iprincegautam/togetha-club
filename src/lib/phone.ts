/** Normalize Indian mobile to 10 digits (strips +91 / leading 0). */
export function normalizeIndianPhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits.slice(0, 10)
}

export function isValidIndianPhone(input: string): boolean {
  const normalized = normalizeIndianPhone(input)
  return normalized.length === 10 && /^[6-9]/.test(normalized)
}

export function formatIndianPhoneDisplay(input: string): string {
  const n = normalizeIndianPhone(input)
  if (n.length !== 10) return input.trim()
  return `${n.slice(0, 5)} ${n.slice(5)}`
}
