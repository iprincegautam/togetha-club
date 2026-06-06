'use client'

import { useCallback, useState } from 'react'
import { QUIZ_QUESTIONS } from '@/constants/quiz'
import { saveQuizAnswers } from '@/lib/quiz-storage'
import { calculateQuizResult } from '@/lib/utils'
import type { QuizAnswers, QuizResult } from '@/types/quiz'

export function useQuiz() {
  const [cur, setCur] = useState(0)
  const [ans, setAns] = useState<QuizAnswers>({})
  const [phase, setPhase] = useState<'quiz' | 'result'>('quiz')
  const [result, setResult] = useState<QuizResult | null>(null)

  const totalQuestions = QUIZ_QUESTIONS.length

  const pick = useCallback((questionId: number, optionIndex: number) => {
    setAns((prev) => ({ ...prev, [questionId]: optionIndex }))
  }, [])

  const setRange = useCallback((questionId: number, value: number) => {
    setAns((prev) => ({ ...prev, [questionId]: value }))
  }, [])

  const setText = useCallback((questionId: number, value: string) => {
    setAns((prev) => ({ ...prev, [questionId]: value }))
  }, [])

  const goNext = useCallback((): QuizResult | undefined => {
    const q = QUIZ_QUESTIONS[cur]
    const updatedAns: QuizAnswers = { ...ans }

    if (q.type === 'range' && updatedAns[q.id] === undefined) {
      updatedAns[q.id] = 7
      setAns(updatedAns)
    }

    if (cur < totalQuestions - 1) {
      setCur((c) => c + 1)
      return undefined
    }

    const computed = calculateQuizResult(updatedAns)
    saveQuizAnswers(updatedAns)
    setResult(computed)
    setPhase('result')
    return computed
  }, [cur, ans, totalQuestions])

  const goBack = useCallback(() => {
    if (cur > 0) {
      setCur((c) => c - 1)
    }
  }, [cur])

  return {
    cur,
    ans,
    phase,
    result,
    totalQuestions,
    pick,
    setRange,
    setText,
    goNext,
    goBack,
  }
}
