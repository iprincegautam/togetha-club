/** Hours after enrollment when each follow-up email becomes due. */
export const NURTURE_STEP_OFFSET_HOURS: Record<number, number> = {
  2: 24,
  3: 72,
  4: 120,
  5: 168,
}

export function nextSendAt(enrolledAt: Date, afterStep: number): Date | null {
  const hours = NURTURE_STEP_OFFSET_HOURS[afterStep + 1]
  if (!hours) return null
  return new Date(enrolledAt.getTime() + hours * 60 * 60 * 1000)
}
