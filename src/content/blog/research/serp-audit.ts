/**
 * Phase 1.3 — SERP & competitor gap audit (June 2026 snapshot).
 * Primary keywords: Blog 1–3 targets from keyword-clusters.ts
 */

export interface SerpResult {
  rank: number
  domain: string
  format: string
  wordCountEst: string
  hasFaq: boolean
  gap: string
}

export interface SerpAuditEntry {
  primaryKeyword: string
  blogSlug: string
  peopleAlsoAsk: string[]
  topResults: SerpResult[]
  togethaDifferentiators: string[]
  contentRecommendation: string
}

export const SERP_AUDITS: SerpAuditEntry[] = [
  {
    primaryKeyword: 'alternatives to dating apps India',
    blogSlug: 'alternatives-to-dating-apps-india',
    peopleAlsoAsk: [
      'What is better than dating apps in India?',
      'Why are people quitting dating apps?',
      'How to meet singles offline in Delhi?',
      'Are offline dating events worth it?',
      'Is Hinge still popular in India?',
    ],
    topResults: [
      { rank: 1, domain: 'indianexpress.com', format: 'Editorial feature', wordCountEst: '1,800', hasFaq: false, gap: 'No product CTA; cultural only' },
      { rank: 2, domain: 'openthemagazine.com', format: 'Long-form essay', wordCountEst: '2,200', hasFaq: false, gap: 'Covers StepOut/Let\'s Socialise, not travel club' },
      { rank: 3, domain: 'letsocialise.in', format: 'Brand landing', wordCountEst: '800', hasFaq: true, gap: 'City events only, no multi-day experience' },
      { rank: 4, domain: 'stepout.live', format: 'Product landing', wordCountEst: '600', hasFaq: false, gap: 'Dinner strangers, not matched cohort travel' },
      { rank: 5, domain: 'reddit.com', format: 'UGC threads', wordCountEst: 'varies', hasFaq: false, gap: 'Fragmented advice, no structured solution' },
      { rank: 6, domain: 'quora.com', format: 'Q&A', wordCountEst: 'varies', hasFaq: false, gap: 'Outdated app recommendations' },
      { rank: 7, domain: 'urbanmatch.in', format: 'Event listing', wordCountEst: '500', hasFaq: false, gap: 'Speed-dating framing Togetha rejects' },
      { rank: 8, domain: 'medium.com', format: 'Personal essay', wordCountEst: '1,200', hasFaq: false, gap: 'No Indian club product' },
    ],
    togethaDifferentiators: [
      'Introduce matchmaking travel club as third rung after apps and city dinners',
      'Experience-first audience (festivals, lifestyle) not covered by SERP leaders',
      'AI quiz + screened 12+12 cohort — no competitor in top 8 owns this',
    ],
    contentRecommendation:
      '2,400-word guide with pros/cons table (apps vs dinners vs group travel vs club), FAQ schema, cite Indian Express/Open, CTA to /match.',
  },
  {
    primaryKeyword: 'matchmaking travel club India',
    blogSlug: 'what-is-matchmaking-travel-club',
    peopleAlsoAsk: [
      'What is a matchmaking trip?',
      'Are singles group trips safe in India?',
      'How is this different from a group tour?',
      'Singles travel Himalayas cost?',
    ],
    topResults: [
      { rank: 1, domain: 'thrivia.io', format: 'Trip PDP', wordCountEst: '900', hasFaq: false, gap: 'Matchmaking games on trip, no AI cohort or screening depth' },
      { rank: 2, domain: 'captureatrip.com', format: 'Category page', wordCountEst: '700', hasFaq: false, gap: '"Matchmaker Trips" = generic singles tour, no 12+12 guarantee' },
      { rank: 3, domain: 'ayushimathur.com', format: 'Retreat landing', wordCountEst: '1,100', hasFaq: true, gap: 'Coach-led weekend, not club model' },
      { rank: 4, domain: 'unitestrangers.com', format: 'Travel agency', wordCountEst: '600', hasFaq: false, gap: 'Random strangers, no matching layer' },
      { rank: 5, domain: 'togetha.club', format: 'Brand home (if indexed)', wordCountEst: 'N/A', hasFaq: true, gap: 'Need dedicated category explainer blog' },
    ],
    togethaDifferentiators: [
      'Own the exact phrase "matchmaking travel club India" with definitional content',
      'Comparison table vs travel agency / dating app / matrimony / festival group',
      'Pan-India destination roadmap + experience types (mountain, desert, festival)',
      'Human + AI matching stack explained in plain English',
    ],
    contentRecommendation:
      '2,800-word pillar with comparison table, experience types matrix, internal links to batches + /match, Organization JSON-LD.',
  },
  {
    primaryKeyword: 'verified singles group trip India',
    blogSlug: 'what-happens-on-a-togetha-experience',
    peopleAlsoAsk: [
      'Is group travel safe for solo female India?',
      'What happens on singles group trips?',
      'Singles trip Himalayas price?',
      'Can introverts join group tours?',
    ],
    topResults: [
      { rank: 1, domain: 'vibeyatri.com', format: 'Trek FAQ', wordCountEst: '1,000', hasFaq: true, gap: 'Adventure community, not singles matching' },
      { rank: 2, domain: 'vgather / meetup', format: 'Event listing', wordCountEst: '500', hasFaq: false, gap: 'Social travel, no gender balance or screening' },
      { rank: 3, domain: 'indiahikes.com', format: 'Trek guide', wordCountEst: '3,000+', hasFaq: true, gap: 'Trek logistics, wrong intent' },
      { rank: 4, domain: 'thrivia.io', format: 'Matchmaking trip PDP', wordCountEst: '900', hasFaq: false, gap: 'Less on safety architecture and pricing transparency' },
    ],
    togethaDifferentiators: [
      'Walk through connection arc (rounds, bonfire, letter exchange) without Love Island framing',
      'Safety architecture section: screening, 12+12, trip leads, vetted venues',
      'Live DB pricing table with deposit % — competitors use static marketing prices',
      'Honest outcome framing (romance possible, not guaranteed)',
    ],
    contentRecommendation:
      '2,200-word BOFU post with FAQPage schema, live pricing component, pilot quotes, strong apply CTA.',
  },
]

export const COMPETITOR_GAPS = {
  travelPlayers: 'Strong on vibe/adventure keywords; weak on compatibility, screening, gender balance as product design.',
  festivalPlayers: 'Event tickets and generic festival groups; no singles club + matching layer.',
  offlineSocial: 'City dinners/mixers; no multi-day immersive experience or pan-India departures.',
  categoryWhiteSpace: ['matchmaking travel club India', 'AI matched singles trip', 'experience travel club singles'],
} as const
