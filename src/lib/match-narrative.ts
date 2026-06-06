import { QUIZ_QUESTIONS } from '@/constants/quiz'
import type { BatchMatchResult, CohortInsight } from '@/types/match'
import type { QuizAnswers } from '@/types/quiz'

function textAnswer(answers: QuizAnswers, id: number): string {
  const value = answers[id]
  return typeof value === 'string' ? value.trim() : ''
}

export function buildFallbackNarrative(
  answers: QuizAnswers,
  match: BatchMatchResult,
  cohort?: CohortInsight | null
): string {
  const metaphor = textAnswer(answers, 7)
  const mountains = textAnswer(answers, 10)
  const lead = match.peerMix[0]
  const second = match.peerMix[1]
  const cohortLine =
    cohort && cohort.sampleSize > 0
      ? ` Against ${cohort.sampleSize} applicants already in the pipeline for this batch, you align with about ${cohort.cohortMatchPercent}% of the current cohort — and ${cohort.strongMatchPercent}% look like strong mutual-fit matches.`
      : ''

  const personalBit =
    mountains.length > 20
      ? ` The mountains would probably say: "${mountains.slice(0, 120)}${mountains.length > 120 ? '…' : ''}" — and our model weights that heavily.`
      : metaphor.length > 10
        ? ` Your "${metaphor.slice(0, 80)}${metaphor.length > 80 ? '…' : ''}" metaphor tells us you're not performing on autopilot.`
        : ''

  return `You read as a ${match.confidence === 'high' ? 'strong' : 'solid'} fit for ${match.batchLabel.toLowerCase()} (${match.matchScore}% compatibility). You're most likely to click with ${lead?.label.toLowerCase() ?? 'your kind of people'}${second ? ` and ${second.label.toLowerCase()} energy` : ''} — not a random tour group.${cohortLine}${personalBit}`
}

export async function generateAiNarrative(
  answers: QuizAnswers,
  match: BatchMatchResult,
  cohort?: CohortInsight | null
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return null

  const metaphor = textAnswer(answers, 7)
  const mountains = textAnswer(answers, 10)
  const emo = answers[5]

  const prompt = `You write warm, specific 2-sentence previews for Togetha.Club — a matchmaking travel club for singles in the Himalayas. No hype, no em dashes overload. Speak directly to the applicant.

Batch: ${match.batchLabel} (${match.batchTagline})
Compatibility: ${match.matchScore}%
Placement likelihood: ${match.placementChance}%
Top peer types: ${match.peerMix.slice(0, 3).map((p) => `${p.label} (${p.percent}%)`).join(', ')}
${cohort && cohort.sampleSize > 0 ? `Cohort overlap: ${cohort.cohortMatchPercent}% with ${cohort.sampleSize} existing applicants` : 'No cohort data yet'}
Emotional availability (1-10): ${typeof emo === 'number' ? emo : 'unknown'}
Metaphor answer: ${metaphor || 'n/a'}
Mountains answer: ${mountains || 'n/a'}

Write exactly 2 sentences: (1) their fit on this batch, (2) the kind of people they're likely to connect with. Do not mention AI or algorithms.`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 180,
        messages: [
          {
            role: 'system',
            content:
              'You are a thoughtful copywriter for a premium singles travel brand in India. Keep it grounded and human.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!res.ok) {
      console.error('[generateAiNarrative]', await res.text())
      return null
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const text = json.choices?.[0]?.message?.content?.trim()
    return text || null
  } catch (err) {
    console.error('[generateAiNarrative]', err)
    return null
  }
}

export function quizAnswerSummary(answers: QuizAnswers): { id: number; question: string; answer: string }[] {
  return QUIZ_QUESTIONS.filter((q) => answers[q.id] !== undefined).map((q) => {
    const raw = answers[q.id]
    let answer = String(raw)
    if (q.type === 'opts' && typeof raw === 'number' && q.opts?.[raw]) {
      answer = q.opts[raw]
    }
    return { id: q.id, question: q.q, answer }
  })
}
