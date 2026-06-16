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

  const data = (await res.json()) as { error?: string; applicantId?: string }

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.')
  }

  if (!data.applicantId) {
    throw new Error('Could not save your details. Please try again.')
  }

  return { applicantId: data.applicantId }
}
