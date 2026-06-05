const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/

export function isValidPan(pan: string): boolean {
  return PAN_REGEX.test(pan.trim().toUpperCase())
}

export function maskPan(pan: string): string {
  const p = pan.trim().toUpperCase()
  if (p.length < 10) return p
  return `${p.slice(0, 2)}*****${p.slice(-1)}`
}

/** Traveler privacy: "Priya R." from "Priya Sharma" */
export function maskTravelerName(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return '—'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  const last = parts[parts.length - 1]
  return `${parts[0]} ${last.charAt(0).toUpperCase()}.`
}

export function relativeTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function formatInrFromPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export function formatInrAmount(amount: number): string {
  return `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export const TDS_194J_THRESHOLD = 50000
export const TDS_194J_WARN = 40000
export const TDS_194R_THRESHOLD = 20000
export const TDS_194R_WARN = 15000
export const TDS_RATE = 0.1

export function calcTdsDeduction(grossPaise: number, cashPayoutsThisYear: number): number {
  if (cashPayoutsThisYear > TDS_194J_THRESHOLD) {
    return Math.round(grossPaise * TDS_RATE)
  }
  return 0
}

export function monthKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('en-IN', { month: 'short' })
}

export function hoursUntilConfirm(createdAt: string): number {
  const deadline = new Date(createdAt).getTime() + 48 * 60 * 60 * 1000
  return Math.max(0, Math.ceil((deadline - Date.now()) / (60 * 60 * 1000)))
}
