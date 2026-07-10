import { BATCH_META } from '@/constants/batches'
import type { ArchetypeId, BatchMatchResult, MatchableBatchSlug } from '@/types/match'
import type { QuizAnswers } from '@/types/quiz'

export interface CohortTeaserPerson {
  id: string
  displayName: string
  role: string
  orgLine: string
  vibeLabel: string
  avatarClass: 'av-teal' | 'av-rose' | 'av-gold'
}

export interface BatchCohortTeaser {
  batchSlug: MatchableBatchSlug
  batchLabel: string
  likeYouCount: number
  people: CohortTeaserPerson[]
  spotsRemaining: number
  spotsRemainingM: number
  spotsRemainingF: number
  urgencyLine: string
}

const FIRST_NAMES_F = [
  'Ananya',
  'Priya',
  'Sneha',
  'Meera',
  'Isha',
  'Kavya',
  'Riya',
  'Aisha',
  'Nandini',
  'Tanya',
]

const FIRST_NAMES_M = [
  'Arjun',
  'Rohan',
  'Aryan',
  'Vihaan',
  'Karan',
  'Aditya',
  'Rahul',
  'Dev',
  'Kabir',
  'Nikhil',
]

const LAST_INITIALS = ['S', 'K', 'R', 'M', 'P', 'G', 'V', 'J', 'A', 'N']

const PROFESSIONAL_POSTS = ['Senior', 'Lead', 'Associate', 'Manager', 'Analyst', 'Consultant', 'Staff']

const PROFESSIONAL_PROFILES = [
  { role: 'Software Engineer', orgs: ['Razorpay', 'Flipkart', 'Zomato', 'PhonePe'] },
  { role: 'Product Designer', orgs: ['Swiggy', 'CRED', 'Nykaa', 'Meesho'] },
  { role: 'Marketing Manager', orgs: ['Myntra', 'Ola', 'Paytm', 'Dream11'] },
  { role: 'Doctor', orgs: ['Apollo Hospitals', 'Fortis', 'Max Healthcare', 'AIIMS OPD'] },
  { role: 'Chartered Accountant', orgs: ['Deloitte', 'EY', 'KPMG', 'PwC'] },
  { role: 'UX Researcher', orgs: ['Google', 'Microsoft', 'Amazon', 'Adobe'] },
  { role: 'Architect', orgs: ['Hafeez Contractor', 'CP Kukreja', 'Morphogenesis', 'Studio Lotus'] },
  { role: 'Management Consultant', orgs: ['BCG', 'McKinsey', 'Bain', 'Accenture'] },
]

const COLLEGE_PROFILES = [
  { role: 'Engineering student', program: 'B.Tech · CS', colleges: ['IIT Delhi', 'IIT Bombay', 'BITS Pilani', 'DTU'] },
  { role: 'Design student', program: 'B.Des', colleges: ['NID Ahmedabad', 'NIFT Delhi', 'Srishti'] },
  { role: 'MBA candidate', program: 'MBA', colleges: ['ISB Hyderabad', 'IIM Bangalore', 'XLRI', 'FMS Delhi'] },
  { role: 'Med student', program: 'MBBS', colleges: ['AIIMS Delhi', 'Maulana Azad', 'KGMU', 'JIPMER'] },
  { role: 'Architecture student', program: 'B.Arch', colleges: ['SPA Delhi', 'CEPT Ahmedabad', 'JJ School'] },
  { role: 'Commerce student', program: 'B.Com · Finance', colleges: ['SRCC', 'Hindu College', "St. Xavier's Mumbai"] },
]

function seedFromAnswers(answers: QuizAnswers, batchSlug: string): number {
  const str = JSON.stringify(answers) + batchSlug
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createRng(seed: number) {
  let state = seed || 1
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)]!
}

function maskDisplayName(rng: () => number, first: string, lastInitial: string): string {
  const style = rng()
  if (style < 0.35) return `${first} ${lastInitial}.`
  if (style < 0.7) return `${first.charAt(0)}*** ${lastInitial}.`
  return `${first.slice(0, 2)}** ${lastInitial}.`
}

function buildOrgLine(
  rng: () => number,
  batchSlug: MatchableBatchSlug,
  preferCollege: boolean
): { role: string; orgLine: string } {
  const useCollege =
    preferCollege ||
    ((batchSlug === 'batch-a' || batchSlug === 'batch-d') && rng() < 0.55) ||
    ((batchSlug === 'batch-b' || batchSlug === 'batch-e') && rng() < 0.25)

  if (useCollege) {
    const profile = pick(rng, COLLEGE_PROFILES)
    const college = pick(rng, profile.colleges)
    const year =
      batchSlug === 'batch-a' || batchSlug === 'batch-d'
        ? pick(rng, ['2nd year', '3rd year', 'Final year'])
        : 'Graduate track'
    return {
      role: `${profile.role} · ${profile.program}`,
      orgLine: `${college} · ${year}`,
    }
  }

  const profile = pick(rng, PROFESSIONAL_PROFILES)
  const org = pick(rng, profile.orgs)
  const post = pick(rng, PROFESSIONAL_POSTS)
  return {
    role: profile.role,
    orgLine: `${post} · ${org}`,
  }
}

function likeYouCountForMatch(match: BatchMatchResult, rng: () => number): number {
  const topPeer = match.peerMix[0]?.percent ?? 20
  const base = Math.round(topPeer / 12 + match.matchScore / 18)
  const jitter = Math.floor(rng() * 3)
  return Math.min(11, Math.max(5, base + jitter))
}

function spotsUrgency(batchSlug: MatchableBatchSlug, rng: () => number) {
  const isGenz = batchSlug === 'batch-a' || batchSlug === 'batch-d'
  const totalLeft = isGenz ? 3 + Math.floor(rng() * 5) : 2 + Math.floor(rng() * 4)
  const spotsRemainingM = Math.max(1, Math.floor(totalLeft / 2 + rng() * 2))
  const spotsRemainingF = Math.max(1, totalLeft - spotsRemainingM + Math.floor(rng() * 2))
  const spotsRemaining = Math.min(8, spotsRemainingM + spotsRemainingF)
  return { spotsRemaining, spotsRemainingM, spotsRemainingF }
}

export function buildBatchCohortTeaser(
  answers: QuizAnswers,
  match: BatchMatchResult
): BatchCohortTeaser {
  const rng = createRng(seedFromAnswers(answers, match.batchSlug))
  const likeYouCount = likeYouCountForMatch(match, rng)
  const { spotsRemaining, spotsRemainingM, spotsRemainingF } = spotsUrgency(match.batchSlug, rng)
  const visibleCount = Math.min(5, Math.max(4, likeYouCount - 1))
  const meta = BATCH_META[match.batchSlug]

  const archetypeLabels: Record<ArchetypeId, string> = {
    bonfire_romantic: 'Bonfire romantic energy',
    chaos_catalyst: 'Chaos catalyst energy',
    thoughtful_planner: 'Thoughtful planner energy',
    free_spirit: 'Free spirit energy',
    quiet_intensity: 'Quiet intensity energy',
    golden_warmth: 'Golden retriever energy',
  }

  const people: CohortTeaserPerson[] = []
  for (let i = 0; i < visibleCount; i++) {
    const female = rng() > 0.48
    const first = pick(rng, female ? FIRST_NAMES_F : FIRST_NAMES_M)
    const lastInitial = pick(rng, LAST_INITIALS)
    const topArchetype = match.peerMix[i % match.peerMix.length]?.id ?? match.peerMix[0]?.id ?? 'golden_warmth'
    const { role, orgLine } = buildOrgLine(
      rng,
      match.batchSlug,
      (match.batchSlug === 'batch-a' || match.batchSlug === 'batch-d') && rng() < 0.45
    )

    people.push({
      id: `${match.batchSlug}-${i}-${first}`,
      displayName: maskDisplayName(rng, first, lastInitial),
      role,
      orgLine,
      vibeLabel: archetypeLabels[topArchetype],
      avatarClass: i % 3 === 0 ? 'av-teal' : i % 3 === 1 ? 'av-rose' : 'av-gold',
    })
  }

  return {
    batchSlug: match.batchSlug,
    batchLabel: meta.label,
    likeYouCount,
    people,
    spotsRemaining,
    spotsRemainingM,
    spotsRemainingF,
    urgencyLine: `Only ${spotsRemaining} spots left for upcoming ${meta.label} departures`,
  }
}

export function buildCohortTeasers(
  answers: QuizAnswers,
  batchMatches: BatchMatchResult[]
): Record<MatchableBatchSlug, BatchCohortTeaser> {
  const map = {} as Record<MatchableBatchSlug, BatchCohortTeaser>
  for (const match of batchMatches) {
    map[match.batchSlug] = buildBatchCohortTeaser(answers, match)
  }
  return map
}
