/**
 * Phase 1.1 — Audience & pain-point research (synthesized from site copy, pilot reviews, market signals).
 * Sources: ReviewsSection, home-faq, batch-content FAQ, Indian Express / Open / Tribune trend coverage.
 */

export type FunnelStage = 'awareness' | 'consideration' | 'decision'

export interface PainPoint {
  id: string
  stage: FunnelStage
  segment: string
  pain: string
  evidence: string
  contentAngle: string
}

export const AUDIENCE_SEGMENTS = [
  {
    id: 'genz-experience',
    label: 'GenZ Edition (18–25)',
    geos: ['Delhi NCR', 'Mumbai', 'Bangalore', 'Pune', 'Goa-adjacent'],
    psychographic:
      'App-native, experience-first, into festivals/clubbing/lifestyle drops; swipe-fatigued but not ready for matrimony framing.',
  },
  {
    id: 'millennial-intent',
    label: 'Millennial Edition (26–36)',
    geos: ['Delhi NCR', 'Mumbai', 'Bangalore', 'Hyderabad', 'Gurgaon'],
    psychographic:
      'Career-stable, premium experience appetite, time-poor, wants depth over speed-dating or endless texting.',
  },
  {
    id: 'festival-lifestyle',
    label: 'Experience-led single (22–32)',
    geos: ['Pan-India metros'],
    psychographic:
      'Follows music/festival calendars; would travel for Sunburn/NH7/desert fests but hates going solo or with random trek groups.',
  },
  {
    id: 'solo-female-safety',
    label: 'Safety-first solo traveler (28–38F)',
    geos: ['All metros'],
    psychographic:
      'Wants verified cohorts, gender balance, and vetted trip leads — especially for nightlife/festival contexts.',
  },
] as const

export const PAIN_POINT_MATRIX: PainPoint[] = [
  {
    id: 'swipe-fatigue',
    stage: 'awareness',
    segment: 'genz-experience',
    pain: 'Dating apps feel like a second job — ghosting, situationships, performative profiles.',
    evidence: 'Indian Express (2024): MAU declines on Tinder/Hinge India; pivot to offline meetups.',
    contentAngle: 'Blog 1 — cultural shift from swiping to showing up for curated experiences.',
  },
  {
    id: 'urban-loneliness',
    stage: 'awareness',
    segment: 'millennial-intent',
    pain: 'Surrounded by people in the city but no one to share a weekend or festival with.',
    evidence: 'StepOut/Tribune founder narrative: millions in city, completely alone on Friday night.',
    contentAngle: 'Blog 1 — loneliness in metros vs intentional cohort design.',
  },
  {
    id: 'fest-solo-fomo',
    stage: 'awareness',
    segment: 'festival-lifestyle',
    pain: 'FOMO on festivals/raves but no crew; generic group trips feel wrong for connection.',
    evidence: 'High engagement on "solo Sunburn" / "group trip strangers" search clusters.',
    contentAngle: 'Blog 1 & 2 — experience context + matched singles, not ticket resale.',
  },
  {
    id: 'matrimony-fear',
    stage: 'consideration',
    segment: 'millennial-intent',
    pain: 'Offline singles events feel like shaadi.com or awkward speed dating.',
    evidence: 'Repeated FAQ objection in batch-content + competitor reviews ("Is this matrimony?").',
    contentAngle: 'Blog 2 — category ladder: not matrimony, not Love Island.',
  },
  {
    id: 'random-group-tour',
    stage: 'consideration',
    segment: 'festival-lifestyle',
    pain: '"Is this just an expensive group trip with marketing?"',
    evidence: 'Home FAQ + Thrivia/Capture A Trip comparison searches.',
    contentAngle: 'Blog 2 — people are the product; trip/experience is context.',
  },
  {
    id: 'cringe-introvert',
    stage: 'decision',
    segment: 'genz-experience',
    pain: 'Introvert anxiety — fear of forced performance or cringe ice breakers.',
    evidence: 'Batch A FAQ: "I\'m shy / introverted. Is this for me?"',
    contentAngle: 'Blog 3 — structured activities, opt-out free time, mountains/fest energy.',
  },
  {
    id: 'safety-female',
    stage: 'decision',
    segment: 'solo-female-safety',
    pain: 'Safety at group travel and festival contexts — who else is on the trip?',
    evidence: 'V-Gather/competitor FAQs; top PAA for "safe group trip solo female India".',
    contentAngle: 'Blog 3 — screening, 12+12 balance, vetted venues, trip leads.',
  },
  {
    id: 'price-regret',
    stage: 'decision',
    segment: 'millennial-intent',
    pain: 'Fear of paying ₹20k+ and regretting it if no romantic spark.',
    evidence: 'Apply funnel drop-off; FAQ "what if I don\'t find someone romantically?"',
    contentAngle: 'Blog 3 — honest outcomes + live DB pricing + refund policy link.',
  },
]

export const CONTENT_CONSUMPTION = {
  discovery: [
    'Instagram Reels (festival B-roll, cohort teasers, "POV: your batch before the headliner")',
    'YouTube Shorts — skeptical-to-converted pilot stories',
    'Google search at intent spikes: alternatives to dating apps, singles group trip, matchmaking travel',
    'Reddit: r/dating_advice, city subs, r/india travel threads',
    'WhatsApp forwards from friends considering applying together',
  ],
  evaluation: [
    'Mobile long-form with scannable H2s',
    'FAQ blocks + comparison tables',
    'Clear "this is NOT X" framing',
    'Social proof quotes from 2025 pilot batches',
  ],
  conversion: [
    'Primary CTA: /match compatibility quiz',
    'Secondary: /batches with live pricing',
    'Shareable pull quote in first scroll for WhatsApp',
  ],
  tone: 'Warm, playful, honest, slightly irreverent — culturally plugged-in (lifestyle/festival-aware), never trek brochure or matrimonial.',
} as const
