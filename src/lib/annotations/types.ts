export type AnnotationCategory =
  | 'general_interest'
  | 'pricing_payment'
  | 'how_to_join'
  | 'destination_question'
  | 'accommodation'
  | 'payment_failure'
  | 'frustrated_user'
  | 'cold_lead'

export type AnnotationUrgency = 'high' | 'medium' | 'low'

export type FailureReason =
  | 'wrong_category'
  | 'ignored_question'
  | 'too_long'
  | 'too_vague'
  | 'made_up_info'
  | 'wrong_followup'
  | 'generic_reply'

export type AnnotationStatus = 'draft' | 'submitted' | 'reviewed'

export interface DmAnnotation {
  id: string
  message_id: string
  user_message: string
  category: AnnotationCategory | null
  urgency: AnnotationUrgency | null
  losing_response: string | null
  failure_reason: FailureReason | null
  winning_response: string | null
  tone_score_losing: number | null
  conversion_score_winning: number | null
  annotator_notes: string | null
  is_flagged: boolean
  annotation_status: AnnotationStatus
  annotator_name: string | null
  rejection_reason: string | null
  judge_score_losing: number | null
  judge_score_winning: number | null
  improvement_delta: number | null
  judge_verdict_losing: string | null
  judge_verdict_winning: string | null
  created_at: string
  submitted_at: string | null
  reviewed_at: string | null
}

export const FAILURE_REASON_OPTIONS: { value: FailureReason; label: string }[] = [
  { value: 'wrong_category', label: 'Wrong category detected' },
  { value: 'ignored_question', label: 'Ignored the question' },
  { value: 'too_long', label: 'Too long' },
  { value: 'too_vague', label: 'Too vague' },
  { value: 'made_up_info', label: 'Made up information' },
  { value: 'wrong_followup', label: 'Asked wrong follow-up question' },
  { value: 'generic_reply', label: 'Gave generic reply' },
]

export function formatJotformTrainingEntry(row: Pick<
  DmAnnotation,
  'user_message' | 'losing_response' | 'winning_response' | 'category' | 'improvement_delta'
>): string {
  return [
    `User said: ${row.user_message}`,
    `Agent replied: ${row.losing_response ?? ''}`,
    `Agent should have replied: ${row.winning_response ?? ''}`,
    `Category: ${row.category ?? 'unknown'}`,
    `Delta: ${row.improvement_delta ?? 'n/a'}`,
  ].join('\n')
}

export function sidebarStatusColor(row: DmAnnotation): 'grey' | 'yellow' | 'green' | 'red' {
  if (row.is_flagged) return 'red'
  if (row.annotation_status === 'submitted' || row.annotation_status === 'reviewed') return 'green'
  const hasDraftWork =
    Boolean(row.winning_response?.trim()) ||
    Boolean(row.failure_reason) ||
    Boolean(row.annotator_notes?.trim()) ||
    row.tone_score_losing != null ||
    row.conversion_score_winning != null
  if (hasDraftWork) return 'yellow'
  return 'grey'
}
