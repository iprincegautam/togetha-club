'use client'

import { useCallback, useState } from 'react'
import { QUIZ_QUESTIONS } from '@/constants/quiz'
import type { DestinationSlug } from '@/constants/destinations'
import { readQuizDestination } from '@/lib/batch-age'
import { saveQuizAnswers } from '@/lib/quiz-storage'
import { calculateQuizResult } from '@/lib/utils'
import type { QuizAnswers, QuizResult } from '@/types/quiz'

export function useQuiz(destination: DestinationSlug = 'himalayan') {
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

  const setAge = useCallback((questionId: number, value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 2)
    setAns((prev) => ({ ...prev, [questionId]: digits }))
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

    if (QUIZ_QUESTIONS[0]?.type === 'age' && updatedAns[0] !== undefined) {
      updatedAns[0] = parseInt(String(updatedAns[0]), 10)
      setAns(updatedAns)
    }

    const effectiveDestination = readQuizDestination(updatedAns) ?? destination
    const computed = calculateQuizResult(updatedAns, effectiveDestination)
    saveQuizAnswers(updatedAns)
    setResult(computed)
    setPhase('result')
    return computed
  }, [cur, ans, totalQuestions, destination])

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
    setAge,
    goNext,
    goBack,
  }
}
