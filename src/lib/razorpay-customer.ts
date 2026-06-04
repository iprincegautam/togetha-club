import type { SupabaseClient } from '@supabase/supabase-js'
import { isRazorpayConfigured, razorpay } from '@/lib/razorpay'

export interface SavedCardToken {
  id: string
  method: string
  bank: string | null
  last4: string | null
  network: string | null
  type: string | null
  expired: boolean
}

export async function getOrCreateRazorpayCustomer(
  service: SupabaseClient,
  input: { userId: string; email: string; name: string; phone?: string | null }
): Promise<{ customerId: string | null; error?: string }> {
  if (!isRazorpayConfigured()) {
    return { customerId: null, error: 'Razorpay not configured' }
  }

  const { data: profile } = await service
    .from('profiles')
    .select('razorpay_customer_id, full_name, phone')
    .eq('id', input.userId)
    .single()

  if (profile?.razorpay_customer_id) {
    return { customerId: profile.razorpay_customer_id }
  }

  try {
    const customer = await razorpay.customers.create({
      name: input.name || 'Member',
      email: input.email,
      contact: input.phone || undefined,
      fail_existing: 0,
    })

    await service
      .from('profiles')
      .update({ razorpay_customer_id: customer.id })
      .eq('id', input.userId)

    return { customerId: customer.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not create Razorpay customer'
    console.error('[getOrCreateRazorpayCustomer]', msg)
    return { customerId: null, error: msg }
  }
}

export async function listSavedCards(customerId: string): Promise<SavedCardToken[]> {
  if (!isRazorpayConfigured() || !customerId) return []

  try {
    const result = await razorpay.customers.fetchTokens(customerId)
    const items = result.items ?? []

    return items
      .filter((t) => t.method === 'card' && t.card)
      .map((t) => ({
        id: t.id,
        method: t.method,
        bank: t.bank,
        last4: t.card?.last4 ?? null,
        network: t.card?.network ?? null,
        type: t.card?.type ?? null,
        expired: Boolean((t as { expired?: boolean }).expired),
      }))
  } catch (err) {
    console.error('[listSavedCards]', err)
    return []
  }
}

export async function deleteSavedCard(
  customerId: string,
  tokenId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isRazorpayConfigured()) {
    return { ok: false, error: 'Razorpay not configured' }
  }

  try {
    await razorpay.customers.deleteToken(customerId, tokenId)
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not remove card'
    return { ok: false, error: msg }
  }
}
