/**
 * Phase 1.2 — Keyword clusters with funnel mapping and blog assignment scores (1–5).
 */

export interface KeywordCluster {
  id: string
  name: string
  examples: string[]
  intent: 'informational' | 'commercial' | 'transactional'
  funnel: 'tofu' | 'mofu' | 'bofu'
  blogAssignment: 1 | 2 | 3 | null
  scoreVolume: 1 | 2 | 3 | 4 | 5
  scoreDifficulty: 1 | 2 | 3 | 4 | 5
  scorePositioning: 1 | 2 | 3 | 4 | 5
  scoreConversion: 1 | 2 | 3 | 4 | 5
  scoreShareability: 1 | 2 | 3 | 4 | 5
  notes: string
}

function totalScore(c: KeywordCluster): number {
  return c.scoreVolume + c.scoreDifficulty + c.scorePositioning + c.scoreConversion + c.scoreShareability
}

export const KEYWORD_CLUSTERS: KeywordCluster[] = [
  {
    id: 'dating-fatigue',
    name: 'Dating app fatigue',
    examples: [
      'alternatives to dating apps India',
      'tired of swiping Hinge Bumble',
      'meet singles offline Delhi Mumbai',
      'offline romance India 2026',
    ],
    intent: 'informational',
    funnel: 'tofu',
    blogAssignment: 1,
    scoreVolume: 4,
    scoreDifficulty: 3,
    scorePositioning: 5,
    scoreConversion: 3,
    scoreShareability: 5,
    notes: 'Primary keyword for Blog 1. High cultural moment; link to matchmaking travel club category.',
  },
  {
    id: 'experience-lifestyle',
    name: 'Experience / lifestyle singles',
    examples: [
      'experience travel club India',
      'singles festival trip India',
      'curated rave trip group',
      'lifestyle travel singles metro',
    ],
    intent: 'commercial',
    funnel: 'tofu',
    blogAssignment: 1,
    scoreVolume: 3,
    scoreDifficulty: 2,
    scorePositioning: 5,
    scoreConversion: 4,
    scoreShareability: 5,
    notes: 'Secondary cluster Blog 1 & 2. Own before travel agencies add "matching" language.',
  },
  {
    id: 'matchmaking-club',
    name: 'Matchmaking travel club (category)',
    examples: [
      'matchmaking travel club India',
      'singles matchmaking trip India',
      'AI matched travel singles',
      'exclusive singles travel club',
    ],
    intent: 'commercial',
    funnel: 'mofu',
    blogAssignment: 2,
    scoreVolume: 2,
    scoreDifficulty: 1,
    scorePositioning: 5,
    scoreConversion: 5,
    scoreShareability: 4,
    notes: 'Primary keyword Blog 2 — category creation, low competition.',
  },
  {
    id: 'regional-singles',
    name: 'Singles travel by region',
    examples: [
      'singles trip Himachal',
      'Uttarakhand group travel singles',
      'Rajasthan desert trip singles',
      'Kashmir group trip verified',
      'Northeast India travel group singles',
    ],
    intent: 'commercial',
    funnel: 'mofu',
    blogAssignment: 2,
    scoreVolume: 3,
    scoreDifficulty: 3,
    scorePositioning: 4,
    scoreConversion: 4,
    scoreShareability: 3,
    notes: 'Pan-India roadmap keywords; pilot deep-dive stays Himalayan with regional framing.',
  },
  {
    id: 'safety-trust',
    name: 'Safety & verified cohorts',
    examples: [
      'verified singles group trip India',
      'safe solo female group travel India',
      'curated singles travel experience',
      'introvert singles events India',
    ],
    intent: 'informational',
    funnel: 'bofu',
    blogAssignment: 3,
    scoreVolume: 3,
    scoreDifficulty: 3,
    scorePositioning: 5,
    scoreConversion: 5,
    scoreShareability: 3,
    notes: 'Primary keyword Blog 3 — conversion-focused trust content.',
  },
  {
    id: 'format-himalayan',
    name: 'Live batch format (pilot)',
    examples: [
      'group trip singles Manali Kasol',
      'bonfire singles trip Himalayas',
      'GenZ vs millennial travel club',
    ],
    intent: 'commercial',
    funnel: 'bofu',
    blogAssignment: 3,
    scoreVolume: 3,
    scoreDifficulty: 4,
    scorePositioning: 3,
    scoreConversion: 5,
    scoreShareability: 4,
    notes: 'Supporting keywords Blog 3 only — avoid optimizing as primary (trek package intent).',
  },
]

export const BLOG_PRIMARY_KEYWORDS = {
  blog1: 'alternatives to dating apps India',
  blog2: 'matchmaking travel club India',
  blog3: 'verified singles group trip India',
} as const

export const TOP_CLUSTERS_BY_SCORE = [...KEYWORD_CLUSTERS]
  .map((c) => ({ ...c, total: totalScore(c) }))
  .sort((a, b) => b.total - a.total)

export const SEO_RULES = [
  'Lead with club / cohort / experience language; geography supports range, not category definition.',
  'Never optimize purely for "Manali package" or generic trek keywords.',
  'All rupee prices must come from Supabase batches table at publish time.',
  'Each blog: 1 primary + 3–5 secondary + 5–8 FAQ schema phrases.',
  'Festival edition mentions only as roadmap unless batch is live in DB.',
] as const
