import Link from 'next/link'
import StampCircle from '@/components/ui/StampCircle'
import { BATCH_META } from '@/constants/batches'
import { ROUTES } from '@/constants/routes'
import { tryCreateServerSupabaseClient } from '@/lib/supabase/server'
import { buildMetadata } from '@/lib/metadata'
import '@/components/apply/apply.css'

const WHATSAPP_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_URL ||
  'https://wa.me/?text=Hi%20Togetha.Club%20%E2%80%94%20I%20just%20confirmed%20my%20spot!'

async function fetchBatchName(slug: string): Promise<string | null> {
  const supabase = tryCreateServerSupabaseClient()
  if (!supabase) return null

  const { data } = await supabase.from('batches').select('name').eq('slug', slug).single()
  return data?.name ?? null
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>
}) {
  const { batch } = await searchParams
  const meta = batch && batch in BATCH_META ? BATCH_META[batch as keyof typeof BATCH_META] : null
  return buildMetadata(
    "You're In — Togetha.Club",
    meta
      ? `Your spot for ${meta.label} is confirmed. We'll be in touch within 48 hours.`
      : 'Your spot is confirmed. Welcome to Togetha.Club.'
  )
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string; plan?: string }>
}) {
  const { batch, plan } = await searchParams
  const isDeposit = plan === 'deposit'
  const meta = batch && batch in BATCH_META ? BATCH_META[batch as keyof typeof BATCH_META] : null
  const batchNameFromDb = batch ? await fetchBatchName(batch) : null
  const batchName = batchNameFromDb ?? meta?.label ?? null

  return (
    <div className="apply-page confirm-page">
      <StampCircle
        text={<>Paid<br />✦<br />2026</>}
        color="var(--teal-stamp)"
        size={100}
        rotation={-10}
        opacity={0.35}
        className="apply-stamp apply-stamp-left"
      />
      <StampCircle
        text={<>♡<br />Confirmed</>}
        color="var(--rose)"
        size={90}
        rotation={12}
        opacity={0.35}
        className="apply-stamp apply-stamp-right"
      />

      <div className="apply-shell confirm-shell">
        <div className="apply-card confirm-card">
          <div className="confirm-icon confirm-star">✦</div>
          <p className="apply-eyebrow">
            {isDeposit ? 'Slot reserved' : 'Payment confirmed'}
          </p>
          <h1 className="apply-title confirm-headline">
            {isDeposit ? 'Your slot is reserved.' : "You're in."}
          </h1>
          <p className="apply-sub confirm-message">
            {isDeposit
              ? batchName
                ? `We've received your booking deposit for ${batchName}. Your spot is held — we'll email you payment details for the remaining balance before departure.`
                : "We've received your booking deposit. Your spot is held — we'll email you payment details for the remaining balance before departure."
              : batchName
                ? `Your spot for ${batchName} is confirmed. We'll email you within 48 hours with your pre-trip pack — what to pack, who you'll meet, and everything else.`
                : "Your spot is confirmed. We'll email you within 48 hours with your pre-trip pack and everything you need."}
          </p>
          <p className="apply-foot confirm-credentials">
            Check your inbox for a separate email with your <strong>member portal login</strong> — the
            email you used for the quiz plus a temporary password. After signing in, set your own
            password under Account → Settings.
          </p>
          <p className="apply-foot">
            Join the group WhatsApp for updates and introductions before departure.
          </p>

          <div className="confirm-actions">
            <Link href={ROUTES.accountLogin} className="confirm-link">
              ✦ Track my booking →
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="confirm-link confirm-whatsapp"
            >
              ♡ Join WhatsApp Group →
            </a>
            <Link href={ROUTES.batches} className="confirm-link outline">
              View all batches
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
