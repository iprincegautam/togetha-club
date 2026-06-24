import {
  NURTURE_SEQUENCE_KEY_V1,
  NURTURE_SEQUENCE_KEY_V2,
  NURTURE_V1_MAX_STEP,
  NURTURE_V2_MAX_STEP,
} from '@/lib/nurture/constants'
import type { DepartureUrgencyTier } from '@/lib/nurture/types'

/** Hours after enrollment when each follow-up email becomes due (v1 legacy). */
const V1_STEP_OFFSET_HOURS: Record<number, number> = {
  2: 24,
  3: 72,
  4: 120,
  5: 168,
}

const V2_OFFSETS_STANDARD: Record<number, number> = {
  2: 24,
  3: 48,
  4: 96,
  5: 144,
  6: 240,
}

const V2_OFFSETS_WARM: Record<number, number> = {
  2: 24,
  3: 48,
  4: 72,
  5: 120,
  6: 168,
}

const V2_OFFSETS_URGENT: Record<number, number> = {
  2: 12,
  3: 24,
  4: 48,
  5: 72,
  6: 96,
}

const V2_OFFSETS_CRITICAL: Record<number, number> = {
  2: 6,
  3: 12,
  4: 18,
  5: 24,
  6: 30,
}

export const MIN_HOURS_BETWEEN_NURTURE_SENDS = 12

function offsetsForTier(tier: DepartureUrgencyTier): Record<number, number> {
  switch (tier) {
    case 'critical':
      return V2_OFFSETS_CRITICAL
    case 'urgent':
      return V2_OFFSETS_URGENT
    case 'warm':
      return V2_OFFSETS_WARM
    case 'passed':
    case 'no_date':
    case 'standard':
    default:
      return V2_OFFSETS_STANDARD
  }
}

export function stepOffsets(
  sequenceKey: string,
  tier: DepartureUrgencyTier = 'standard'
): Record<number, number> {
  if (sequenceKey === NURTURE_SEQUENCE_KEY_V1) return V1_STEP_OFFSET_HOURS
  return offsetsForTier(tier)
}

export function maxStepForSequenceKey(sequenceKey: string): number {
  return sequenceKey === NURTURE_SEQUENCE_KEY_V2 ? NURTURE_V2_MAX_STEP : NURTURE_V1_MAX_STEP
}

export function nextSendAt(
  enrolledAt: Date,
  afterStep: number,
  sequenceKey: string = NURTURE_SEQUENCE_KEY_V2,
  tier: DepartureUrgencyTier = 'standard'
): Date | null {
  const nextStep = afterStep + 1
  const maxStep = maxStepForSequenceKey(sequenceKey)
  if (nextStep > maxStep) return null

  const offsets = stepOffsets(sequenceKey, tier)
  const hours = offsets[nextStep]
  if (!hours) return null

  return new Date(enrolledAt.getTime() + hours * 60 * 60 * 1000)
}

/** Pull due time earlier when urgency tier escalates (critical/urgent windows). */
export function maybePullForwardSendAt(
  currentNextSendAt: string | null,
  enrolledAt: Date,
  afterStep: number,
  sequenceKey: string,
  tier: DepartureUrgencyTier,
  now: Date = new Date()
): Date | null {
  const ideal = nextSendAt(enrolledAt, afterStep, sequenceKey, tier)
  if (!ideal) return null

  if (tier !== 'critical' && tier !== 'urgent') {
    return ideal
  }

  const minGapMs = MIN_HOURS_BETWEEN_NURTURE_SENDS * 60 * 60 * 1000
  const earliest = new Date(now.getTime() + minGapMs)

  if (currentNextSendAt) {
    const scheduled = new Date(currentNextSendAt)
    if (scheduled <= now) return scheduled
    if (ideal < scheduled) {
      return ideal > earliest ? ideal : earliest
    }
    return scheduled
  }

  return ideal > earliest ? ideal : earliest
}
