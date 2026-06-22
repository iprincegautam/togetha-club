import type { QuizAnswers } from '@/types/quiz'

export type QuizLeadSource = 'quiz_match_lab' | 'quiz'

export type SubmitQuizLeadInput = {
  name: string
  email: string
  phone: string
  answers: QuizAnswers
  score: number
  batchRecommendation: string
  leadSource: QuizLeadSource
  wantsCallback?: boolean
}

export type SubmitQuizLeadResult = {
  applicantId: string
  nurtureEmailSent?: boolean
  nurtureError?: string | null
}

export async function ensureNurtureEmail(applicantId: string): Promise<{
  sent: boolean
  error: string | null
}> {
  return triggerNurtureEmail(applicantId)
}

async function triggerNurtureEmail(applicantId: string): Promise<{
  sent: boolean
  error: string | null
}> {
  try {
    const res = await fetch('/api/quiz/enroll-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicantId }),
    })
    const data = (await res.json()) as { ok?: boolean; error?: string }
    if (!res.ok || !data.ok) {
      return { sent: false, error: data.error ?? 'enroll_failed' }
    }
    return { sent: true, error: null }
  } catch {
    return { sent: false, error: 'enroll_request_failed' }
  }
}

export async function submitQuizLead(
  input: SubmitQuizLeadInput
): Promise<SubmitQuizLeadResult> {
  const res = await fetch('/api/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      phone: input.phone,
      answers: input.answers,
      score: input.score,
      batchRecommendation: input.batchRecommendation,
      leadSource: input.leadSource,
      wantsCallback: input.wantsCallback ?? true,
    }),
  })

  const data = (await res.json()) as {
    error?: string
    applicantId?: string
    nurture?: { ok?: boolean; emailSent?: boolean; error?: string | null }
  }

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.')
  }

  if (!data.applicantId) {
    throw new Error('Could not save your details. Please try again.')
  }

  let nurtureEmailSent = Boolean(data.nurture?.emailSent)
  let nurtureError = data.nurture?.error ?? null

  if (!nurtureEmailSent) {
    const backup = await triggerNurtureEmail(data.applicantId)
    nurtureEmailSent = backup.sent
    nurtureError = backup.error
  }

  return {
    applicantId: data.applicantId,
    nurtureEmailSent,
    nurtureError,
  }
}
