import Reveal from '@/components/ui/Reveal'
import Link from 'next/link'
import SectionLabel from '@/components/ui/SectionLabel'
import { ROUTES } from '@/constants/routes'
import { formatPrice } from '@/lib/utils'
import type { Batch, BatchStatus } from '@/types/batch'

type BatchPreview = Pick<
  Batch,
  'slug' | 'name' | 'price' | 'spotsTakenM' | 'spotsTakenF' | 'status'
>

interface BatchPreviewSectionProps {
  batches: BatchPreview[]
}

const BATCH_DISPLAY: Record<
  string,
  {
    genBadge: string
    statusBadge: string
    statusClass: string
    meta: string
    priceClass: string
    ctaClass: string
  }
> = {
  'batch-a': {
    genBadge: 'GenZ · 20–27',
    statusBadge: '✦ Spots Open',
    statusClass: 'tb-teal',
    meta: 'Manali · Kasol · Sissu · 5N/6D · Jun 13, Jun 27, Jul 11, Jul 25',
    priceClass: '',
    ctaClass: '',
  },
  'batch-b': {
    genBadge: 'Millennial · 28–38',
    statusBadge: '♡ Spots Open',
    statusClass: 'tb-rose',
    meta: 'Manali · Kasol · Sissu · 5N/6D · Jun 27, Jul 11, Jul 25',
    priceClass: 'tpc-price-rose',
    ctaClass: 'tpc-cta-rose',
  },
}

function SpotsRow({ takenM, takenF }: { takenM: number; takenF: number }) {
  const dots: string[] = []
  for (let i = 0; i < 12; i++) {
    dots.push(i < takenM ? 'sd-m' : 'sd-e')
  }
  for (let i = 0; i < 12; i++) {
    dots.push(i < takenF ? 'sd-f' : 'sd-e')
  }

  return (
    <div className="spots-row">
      {dots.map((cls, i) => (
        <div key={i} className={`sd ${cls}`} />
      ))}
    </div>
  )
}

function BatchAVisual() {
  return (
    <svg viewBox="0 0 480 190" xmlns="http://www.w3.org/2000/svg">
      <rect width="480" height="190" fill="#D4E9F7" />
      <circle cx="400" cy="48" r="30" fill="#F9D54A" opacity="0.9" />
      <circle cx="400" cy="48" r="22" fill="#FCEA7E" />
      <g fill="white" opacity="0.8">
        <ellipse cx="68" cy="42" rx="40" ry="16" />
        <ellipse cx="93" cy="36" rx="30" ry="14" />
        <ellipse cx="46" cy="40" rx="26" ry="12" />
      </g>
      <polygon points="0,144 68,76 128,108 186,80 244,124 302,86 360,114 420,80 480,100 480,190 0,190" fill="#4A8B5C" opacity="0.9" />
      <polygon points="68,76 80,96 68,94 56,96" fill="white" opacity="0.85" />
      <polygon points="186,80 197,100 186,98 175,100" fill="white" opacity="0.85" />
      <rect x="0" y="162" width="480" height="28" fill="#3D7A49" />
      <g fill="#2D6040">
        <polygon points="38,162 46,140 54,162" />
        <polygon points="41,154 49,132 57,154" />
        <polygon points="398,162 406,142 414,162" />
        <polygon points="436,162 444,140 452,162" />
      </g>
      <g transform="translate(208,142)">
        <ellipse cx="20" cy="13" rx="17" ry="4" fill="rgba(180,80,20,0.2)" />
        <path d="M12 13 Q16 6 20 2 Q22 7 18 10 Q23 5 20 2 Q16 8 20 12Z" fill="#E87832" />
        <path d="M15 11 Q17 7 20 4 Q21 8 19 10 Q21 6 20 4 Q18 8 20 11Z" fill="#F5D147" />
      </g>
      <g fill="rgba(44,24,16,0.65)">
        <circle cx="193" cy="162" r="5" />
        <path d="M193 167 Q190 172 188 178 Q193 176 193 167Z" />
        <path d="M193 167 Q196 172 198 178 Q193 176 193 167Z" />
        <circle cx="248" cy="160" r="4.5" />
        <path d="M248 165 Q245 170 243 176 Q248 174 248 165Z" />
        <path d="M248 165 Q251 170 253 176 Q248 174 248 165Z" />
      </g>
      <text x="14" y="183" fontFamily="Georgia" fontStyle="italic" fontSize="8.5" fill="rgba(44,24,16,0.38)">Manali · Kasol · Sissu</text>
      <text x="14" y="76" fontFamily="serif" fontSize="17" fill="#D4516A" opacity="0.55">♡</text>
      <text x="348" y="62" fontFamily="serif" fontSize="11" fill="#D4516A" opacity="0.38">♡</text>
    </svg>
  )
}

function BatchBVisual() {
  return (
    <svg viewBox="0 0 480 190" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="dsk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2C3E6B" />
          <stop offset="55%" stopColor="#C47B4E" />
          <stop offset="100%" stopColor="#E8A86A" />
        </linearGradient>
      </defs>
      <rect width="480" height="190" fill="url(#dsk)" />
      <circle cx="378" cy="52" r="28" fill="#F5E6C8" opacity="0.95" />
      <circle cx="388" cy="46" r="22" fill="#2C3E6B" />
      <g fill="#F5E6C8" opacity="0.58">
        <circle cx="38" cy="28" r="1.5" />
        <circle cx="98" cy="16" r="1" />
        <circle cx="176" cy="26" r="1.5" />
        <circle cx="256" cy="13" r="1" />
        <circle cx="428" cy="23" r="1.5" />
      </g>
      <polygon points="0,156 96,102 163,128 228,96 302,124 364,90 432,114 480,98 480,190 0,190" fill="#1A2A4A" opacity="0.9" />
      <polygon points="96,102 107,122 96,120 85,122" fill="#E8DFC8" opacity="0.8" />
      <polygon points="228,96 239,116 228,114 217,116" fill="#E8DFC8" opacity="0.8" />
      <rect x="0" y="168" width="480" height="22" fill="#0D1B2E" />
      <polygon points="144,168 177,134 210,168" fill="#C47B4E" opacity="0.9" />
      <polygon points="282,170 312,142 342,170" fill="#2D6040" opacity="0.9" />
      <g fill="#0D1B2E" opacity="0.8">
        <circle cx="183" cy="168" r="4.5" />
        <path d="M183 173 Q180 178 178 184 Q183 182 183 173Z" />
        <path d="M183 173 Q186 178 188 184 Q183 182 183 173Z" />
        <circle cx="200" cy="166" r="4" />
        <path d="M200 171 Q197 176 195 182 Q200 180 200 171Z" />
        <path d="M200 171 Q203 176 205 182 Q200 180 200 171Z" />
      </g>
      <text x="62" y="106" fontFamily="serif" fontSize="11" fill="#E8A86A" opacity="0.48">♡</text>
      <text x="414" y="92" fontFamily="serif" fontSize="8" fill="#E8A86A" opacity="0.38">♡</text>
      <text x="18" y="184" fontFamily="Georgia" fontStyle="italic" fontSize="8.5" fill="rgba(245,230,200,0.32)">Dusk in Kasol · Two strangers · One sky</text>
    </svg>
  )
}

function statusLabel(status: BatchStatus): string {
  switch (status) {
    case 'open':
      return '✦ Spots Open'
    case 'sold_out':
      return 'Sold Out'
    case 'waitlist':
      return 'Waitlist'
    case 'coming_soon':
      return 'Coming Soon'
    default:
      return '✦ Spots Open'
  }
}

export default function BatchPreviewSection({ batches }: BatchPreviewSectionProps) {
  const ordered = ['batch-a', 'batch-b']
    .map((slug) => batches.find((b) => b.slug === slug))
    .filter((b): b is BatchPreview => b !== undefined)

  return (
    <Reveal>
    <section className="sec" id="batches" style={{ background: 'var(--paper)' }}>
      <div className="sec-inner">
        <SectionLabel>The Batches</SectionLabel>
        <h2 className="sec-title">
          Choose your <span className="t">tribe.</span>
        </h2>
        <p className="sec-sub">
          Two generations. Two vibes. One mountain range. Same magic.
        </p>
        <div className="trips-grid">
          {ordered.map((batch) => {
            const display = BATCH_DISPLAY[batch.slug] ?? BATCH_DISPLAY['batch-a']
            const Visual = batch.slug === 'batch-b' ? BatchBVisual : BatchAVisual

            return (
              <Link
                key={batch.slug}
                href={ROUTES.batches}
                className="tpc"
              >
                <div className="tpc-vis">
                  <Visual />
                </div>
                <div className="tpc-body">
                  <div className="tpc-badges">
                    <span className="tb tb-dark">{display.genBadge}</span>
                    <span className={`tb ${display.statusClass}`}>
                      {statusLabel(batch.status)}
                    </span>
                  </div>
                  <div className="tpc-title">{batch.name}</div>
                  <div className="tpc-meta">{display.meta}</div>
                  {batch.price !== null && (
                    <div className={`tpc-price ${display.priceClass}`}>
                      {formatPrice(batch.price)}
                      <span className="tpc-price-per">per person</span>
                    </div>
                  )}
                  <SpotsRow takenM={batch.spotsTakenM} takenF={batch.spotsTakenF} />
                  <div className={`tpc-cta ${display.ctaClass}`}>
                    View details &amp; book your spot →
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        <div className="batch-waitlist-wrap">
          <Link href={ROUTES.batches} className="batch-waitlist-link">
            ✦ + August Mystery Batch — Join Waitlist →
          </Link>
        </div>
      </div>
    </section>
    </Reveal>
  )
}
