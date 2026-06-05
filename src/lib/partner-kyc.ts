import { isValidPan, maskPan } from '@/lib/partner-portal'

export type KycDocumentType = 'pan' | 'aadhaar' | 'driving_license'

export const KYC_DOCUMENT_OPTIONS: {
  id: KycDocumentType
  label: string
  hint: string
  numberLabel: string
  numberPlaceholder: string
}[] = [
  {
    id: 'pan',
    label: 'PAN card',
    hint: 'Best if you have one — needed for TDS on large payouts',
    numberLabel: 'PAN number',
    numberPlaceholder: 'ABCDE1234F',
  },
  {
    id: 'aadhaar',
    label: 'Aadhaar card',
    hint: '12-digit government ID',
    numberLabel: 'Aadhaar number',
    numberPlaceholder: '1234 5678 9012',
  },
  {
    id: 'driving_license',
    label: 'Driving license',
    hint: 'Valid Indian driving license',
    numberLabel: 'License number',
    numberPlaceholder: 'DL-0123456789',
  },
]

export function isKycDocumentType(value: string): value is KycDocumentType {
  return value === 'pan' || value === 'aadhaar' || value === 'driving_license'
}

export function normalizeAadhaar(value: string): string {
  return value.replace(/\D/g, '')
}

export function isValidAadhaar(value: string): boolean {
  return /^\d{12}$/.test(normalizeAadhaar(value))
}

export function isValidDrivingLicense(value: string): boolean {
  const v = value.trim().toUpperCase()
  return v.length >= 5 && v.length <= 20 && /^[A-Z0-9\-/]+$/.test(v)
}

export function validateKycDocument(type: KycDocumentType, number: string): string | null {
  const trimmed = number.trim()
  if (!trimmed) return 'Document number is required'

  if (type === 'pan') {
    return isValidPan(trimmed) ? null : 'Invalid PAN format (e.g. ABCDE1234F)'
  }
  if (type === 'aadhaar') {
    return isValidAadhaar(trimmed) ? null : 'Aadhaar must be 12 digits'
  }
  return isValidDrivingLicense(trimmed) ? null : 'Enter a valid driving license number'
}

export function normalizeKycDocumentNumber(type: KycDocumentType, number: string): string {
  if (type === 'pan') return number.trim().toUpperCase()
  if (type === 'aadhaar') return normalizeAadhaar(number)
  return number.trim().toUpperCase()
}

export function maskKycDocumentNumber(type: KycDocumentType, number: string): string {
  if (type === 'pan') return maskPan(number)
  if (type === 'aadhaar') {
    const digits = normalizeAadhaar(number)
    if (digits.length < 4) return digits
    return `**** **** ${digits.slice(-4)}`
  }
  const v = number.trim().toUpperCase()
  if (v.length <= 4) return v
  return `${v.slice(0, 2)}****${v.slice(-2)}`
}

export function kycDocumentLabel(type: KycDocumentType | string | null | undefined): string {
  if (type === 'aadhaar') return 'Aadhaar card'
  if (type === 'driving_license') return 'Driving license'
  return 'PAN card'
}
