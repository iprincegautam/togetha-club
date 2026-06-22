'use client'

import Link from 'next/link'
import StampCircle from '@/components/ui/StampCircle'
import { ROUTES } from '@/constants/routes'
export default function HeroSection() {
  return (
    <section className="hero" id="top">
      <div className="hero-stamps hero-stamps--desktop" aria-hidden="true">
        <div className="hero-stamp-wrap anim-stamp-drift" style={{ top: 100, left: 60 }}>
          <StampCircle
            text={<>India&apos;s<br />First ♡<br />Love Trip</>}
            color="var(--rose)"
            size={125}
            rotation={-15}
            opacity={0.35}
            className="hero-stamp hero-stamp-love"
          />
        </div>
        <div
          className="hero-stamp-wrap anim-stamp-drift-alt"
          style={{ top: 108, right: 80 }}
        >
          <StampCircle
            text={<>Togetha<br />Club<br />✦ 2026 ✦</>}
            color="var(--teal)"
            size={108}
            rotation={12}
            opacity={0.35}
            className="hero-stamp hero-stamp-club"
          />
        </div>
        <div
          className="hero-stamp-wrap anim-float-delay-1"
          style={{ bottom: 130, left: 120 }}
        >
          <StampCircle
            text={<>Manali<br />Kasol<br />Sissu</>}
            color="var(--gold)"
            size={88}
            rotation={-8}
            opacity={0.35}
            className="hero-stamp hero-stamp-routes"
          />
        </div>
        <div
          className="hero-stamp-wrap anim-float-delay-2"
          style={{ bottom: 110, right: 100 }}
        >
          <StampCircle
            text={<>12+12<br />Singles<br />✦</>}
            color="var(--ink-mid)"
            size={96}
            rotation={10}
            opacity={0.35}
            className="hero-stamp hero-stamp-singles"
          />
        </div>
      </div>

      <span className="hero-floatie hero-floatie-1 anim-hero-sparkle" aria-hidden="true">
        ✦
      </span>
      <span className="hero-floatie hero-floatie-2 anim-hero-sparkle-delay" aria-hidden="true">
        ♡
      </span>
      <span className="hero-floatie hero-floatie-3 anim-float" aria-hidden="true">
        ✦
      </span>

      <div className="hero-content">
        <p className="hero-eyebrow anim-float">✦ India&apos;s First Matchmaking Travel Club ✦</p>

        <div className="hero-stamps hero-stamps--mobile" aria-hidden="true">
          <StampCircle
            text={<>India&apos;s<br />First ♡<br />Love Trip</>}
            color="var(--rose)"
            size={88}
            rotation={-12}
            opacity={0.35}
            className="hero-stamp-inline"
          />
          <StampCircle
            text={<>Togetha<br />Club<br />✦ 2026 ✦</>}
            color="var(--teal)"
            size={80}
            rotation={10}
            opacity={0.35}
            className="hero-stamp-inline"
          />
        </div>

        <h1 className="hero-title anim-title-pop">
          <span className="ht-teal">Like Hinge,</span>
          <br />
          but <span className="ht-rose">for</span>
          <br />
          <span className="ht-gold">travelers.</span>
        </h1>
        <p className="hero-sub">
          Take the quiz, book your slot, pay online — then 6 days in the Himalayas with 12 boys and
          12 girls, AI-matched.
        </p>
        <div className="hero-btns">
          <Link href={ROUTES.match} className="btn-p">
            Take the Quiz →
          </Link>
          <Link href={ROUTES.batches} className="btn-o">
            See Batches
          </Link>
        </div>
      </div>

      <div className="hero-scene anim-float-delay-1">
        <svg viewBox="0 0 680 272" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="skyH" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C8E8F5" />
              <stop offset="100%" stopColor="#E8D5B0" />
            </linearGradient>
          </defs>
          <rect width="680" height="272" fill="url(#skyH)" />
          <rect x="6" y="6" width="668" height="260" fill="none" stroke="rgba(44,24,16,0.12)" strokeWidth="1" strokeDasharray="6 4" />
          <circle cx="598" cy="60" r="36" fill="#F9D54A" opacity="0.85" />
          <circle cx="598" cy="60" r="27" fill="#FCEA7E" />
          <g fill="white" opacity="0.78">
            <ellipse cx="78" cy="52" rx="44" ry="17" />
            <ellipse cx="106" cy="44" rx="34" ry="15" />
            <ellipse cx="54" cy="49" rx="28" ry="13" />
            <ellipse cx="296" cy="40" rx="36" ry="14" />
            <ellipse cx="324" cy="33" rx="26" ry="12" />
          </g>
          <polygon points="0,195 78,98 148,145 208,107 276,164 344,112 408,150 476,96 538,140 596,107 648,136 680,122 680,272 0,272" fill="#7BAFC7" opacity="0.42" />
          <polygon points="78,98 91,118 78,116 65,118" fill="white" opacity="0.85" />
          <polygon points="208,107 220,128 208,126 196,128" fill="white" opacity="0.85" />
          <polygon points="476,96 488,117 476,115 464,117" fill="white" opacity="0.85" />
          <polygon points="0,224 88,152 157,180 226,152 304,195 366,158 436,190 508,152 566,180 646,150 680,166 680,272 0,272" fill="#4A8B5C" opacity="0.88" />
          <rect x="0" y="234" width="680" height="38" fill="#3D7A49" />
          <ellipse cx="340" cy="234" rx="680" ry="13" fill="#4A8B5C" />
          <g fill="#2D6040">
            <polygon points="48,234 57,210 66,234" />
            <polygon points="52,226 61,200 70,226" />
            <polygon points="116,234 125,212 134,234" />
            <polygon points="120,226 129,204 138,226" />
            <polygon points="538,234 547,212 556,234" />
            <polygon points="542,226 551,204 560,226" />
            <polygon points="606,234 615,210 624,234" />
            <polygon points="610,226 619,202 628,226" />
          </g>
          <g transform="translate(298,218)">
            <ellipse cx="42" cy="16" rx="20" ry="5" fill="rgba(180,80,20,0.22)" />
            <path d="M32 16 Q36 7 42 3 Q44 8 40 11 Q45 6 42 3 Q38 9 42 15Z" fill="#E87832" />
            <path d="M35 14 Q37 9 42 5 Q43 9 41 12 Q43 8 42 5 Q40 9 42 14Z" fill="#F5D147" />
            <line x1="25" y1="16" x2="59" y2="14" stroke="#5C3D2E" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="27" y1="19" x2="57" y2="17" stroke="#5C3D2E" strokeWidth="2.5" strokeLinecap="round" />
          </g>
          <g fill="rgba(44,24,16,0.65)">
            <circle cx="278" cy="234" r="5.5" />
            <path d="M278 240 Q275 245 273 252 Q278 250 278 240Z" />
            <path d="M278 240 Q281 245 283 252 Q278 250 278 240Z" />
            <circle cx="356" cy="232" r="5" />
            <path d="M356 237 Q353 242 351 248 Q356 246 356 237Z" />
            <path d="M356 237 Q359 242 361 248 Q356 246 356 237Z" />
            <circle cx="322" cy="237" r="4.5" />
            <path d="M322 242 Q319 247 317 253 Q322 251 322 242Z" />
            <path d="M322 242 Q325 247 327 253 Q322 251 322 242Z" />
          </g>
          <g fill="#F9D54A" opacity="0.55">
            <circle cx="28" cy="26" r="1.5" />
            <circle cx="158" cy="18" r="1" />
            <circle cx="248" cy="28" r="1.5" />
            <circle cx="418" cy="16" r="1" />
            <circle cx="498" cy="32" r="1.5" />
          </g>
          <text x="198" y="88" fontFamily="serif" fontSize="18" fill="#D4516A" opacity="0.52">♡</text>
          <text x="458" y="74" fontFamily="serif" fontSize="13" fill="#D4516A" opacity="0.34">♡</text>
          <text x="148" y="128" fontFamily="serif" fontSize="10" fill="#D4516A" opacity="0.28">♡</text>
          <rect x="608" y="16" width="52" height="36" rx="2" fill="white" stroke="rgba(44,24,16,0.28)" strokeWidth="1" />
          <rect x="612" y="20" width="44" height="28" rx="1" fill="#E8F4E8" />
          <text x="634" y="32" textAnchor="middle" fontFamily="Georgia" fontSize="6.5" fill="#1A6B5A" fontWeight="bold">TOGETHA</text>
          <text x="634" y="43" textAnchor="middle" fontFamily="Georgia" fontSize="6" fill="#4A8B5C">INDIA 2026</text>
          <text x="18" y="262" fontFamily="Georgia" fontStyle="italic" fontSize="9.5" fill="rgba(44,24,16,0.38)">Manali · Kasol · Sissu — Where strangers become stories</text>
        </svg>
      </div>
    </section>
  )
}
