export const NURTURE_SEQUENCE_KEY_V1 = 'quiz_nurture_v1'
export const NURTURE_SEQUENCE_KEY_V2 = 'quiz_nurture_v2'
export const NURTURE_SEQUENCE_KEY = NURTURE_SEQUENCE_KEY_V2

export const NURTURE_V1_MAX_STEP = 5
export const NURTURE_V2_MAX_STEP = 6

export const NURTURE_SEQUENCE_KEYS = [NURTURE_SEQUENCE_KEY_V1, NURTURE_SEQUENCE_KEY_V2] as const

export function maxStepForSequence(sequenceKey: string): number {
  return sequenceKey === NURTURE_SEQUENCE_KEY_V2 ? NURTURE_V2_MAX_STEP : NURTURE_V1_MAX_STEP
}
