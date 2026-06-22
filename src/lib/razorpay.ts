import crypto from 'crypto'
import Razorpay from 'razorpay'

function buildClient(keyId: string, keySecret: string): Razorpay {
  return new Razorpay({ key_id: keyId, key_secret: keySecret })
}

export const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? buildClient(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET)
    : (null as unknown as Razorpay)

function razorpayClientsForFetch(): Razorpay[] {
  const clients: Razorpay[] = []
  const seen = new Set<string>()

  const add = (keyId?: string, keySecret?: string) => {
    if (!keyId || !keySecret) return
    const sig = `${keyId}:${keySecret.slice(0, 4)}`
    if (seen.has(sig)) return
    seen.add(sig)
    clients.push(buildClient(keyId, keySecret))
  }

  add(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET)
  add(process.env.RAZORPAY_LIVE_KEY_ID, process.env.RAZORPAY_LIVE_KEY_SECRET)

  return clients
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = orderId + '|' + paymentId
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex')
  return expectedSignature === signature
}

export function isRazorpayConfigured(): boolean {
  return razorpayClientsForFetch().length > 0
}

/** Key ID exposed to Razorpay Checkout — must match the server key pair. */
export function getRazorpayCheckoutKeyId(): string | undefined {
  const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim()
  const serverKey = process.env.RAZORPAY_KEY_ID?.trim()
  return publicKey || serverKey
}

export function validateRazorpayKeyConfiguration():
  | { ok: true; keyId: string }
  | { ok: false; message: string } {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim()
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
  const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim()

  if (!keyId || !keySecret) {
    return {
      ok: false,
      message:
        'Payment gateway is not configured on the server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
    }
  }

  if (publicKeyId && publicKeyId !== keyId) {
    return {
      ok: false,
      message:
        'Payment gateway misconfigured: NEXT_PUBLIC_RAZORPAY_KEY_ID must be the same Key ID as RAZORPAY_KEY_ID.',
    }
  }

  if (process.env.NODE_ENV === 'production' && keyId.startsWith('rzp_test_')) {
    return {
      ok: false,
      message: 'Production is using Razorpay test keys. Add live keys in Vercel environment settings.',
    }
  }

  return { ok: true, keyId }
}

export function formatRazorpayApiError(err: unknown): string {
  const apiErr = err as RazorpayApiError
  const desc = apiErr.error?.description?.trim()

  if (apiErr.statusCode === 401) {
    return (
      'Payment gateway authentication failed. The Razorpay API keys on the server are invalid or expired — ' +
      'update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel (Production), then redeploy.'
    )
  }

  if (desc) return desc
  if (err instanceof Error && err.message) return err.message
  return 'Could not create a payment order. Please try again or contact support.'
}

/** Razorpay receipt max 40 chars; must be unique per order. */
export function buildOrderReceipt(seed: string): string {
  const compact = seed.replace(/-/g, '').slice(0, 24)
  const stamp = Date.now().toString(36)
  return `${compact}_${stamp}`.slice(0, 40)
}

export function isLiveRazorpayKey(keyId: string | undefined): boolean {
  return Boolean(keyId?.startsWith('rzp_live_'))
}

export type RazorpayPaymentRecord = {
  id: string
  entity: string
  amount: number
  currency: string
  status: string
  order_id?: string
  email?: string
  contact?: string
  notes?: Record<string, string>
}

type RazorpayApiError = {
  statusCode?: number
  error?: { description?: string; code?: string }
}

function describeFetchFailure(err: unknown, usedTestKeys: boolean): string {
  const apiErr = err as RazorpayApiError
  const desc = apiErr.error?.description ?? ''
  const isMissing =
    apiErr.statusCode === 400 &&
    (desc.includes('does not exist') || desc.includes('not exist'))

  if (isMissing && usedTestKeys) {
    return (
      'This payment was not found with your Test Mode Razorpay keys. ' +
      'If you paid in Live Mode (Test Mode toggle OFF in Razorpay), add RAZORPAY_LIVE_KEY_ID and ' +
      'RAZORPAY_LIVE_KEY_SECRET to .env.local, or make a new payment in Test Mode.'
    )
  }

  if (isMissing) {
    return 'Could not find that payment in Razorpay. Check the payment ID and API keys.'
  }

  return desc || 'Could not fetch payment from Razorpay. Check your API keys and try again.'
}

/** Try default keys, then optional live keys (for local dev against Live Mode payments). */
export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPaymentRecord> {
  const clients = razorpayClientsForFetch()
  if (!clients.length) {
    throw new Error('Razorpay not configured')
  }

  const usedTestKeys = Boolean(process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_'))
  let lastError: unknown

  for (const client of clients) {
    try {
      const payment = await client.payments.fetch(paymentId)
      return payment as RazorpayPaymentRecord
    } catch (err) {
      lastError = err
    }
  }

  throw new Error(describeFetchFailure(lastError, usedTestKeys))
}

export function isPlaceholderRazorpayEmail(email: string | undefined | null): boolean {
  if (!email?.trim()) return true
  const normalized = email.trim().toLowerCase()
  return (
    normalized === 'void@razorpay.com' ||
    normalized.endsWith('@razorpay.com') ||
    normalized === 'null@razorpay.com'
  )
}

/** Razorpay IDs are case-insensitive; users often paste Pay_ from receipts. */
export function normalizeRazorpayPaymentId(raw: string): string {
  return raw.trim().replace(/^pay_/i, 'pay_')
}

export function isValidRazorpayPaymentId(raw: string): boolean {
  const id = normalizeRazorpayPaymentId(raw)
  return id.startsWith('pay_') && id.length > 4
}
