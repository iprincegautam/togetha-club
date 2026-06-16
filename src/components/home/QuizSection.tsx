import Reveal from '@/components/ui/Reveal'
import QuizWidget from '@/components/quiz/QuizWidget'
import type { QuizAnswers } from '@/types/quiz'

type Props = {
  onComplete?: (answers: QuizAnswers) => void
  delegateResults?: boolean
  quizKey?: number
}

export default function QuizSection({ onComplete, delegateResults, quizKey }: Props) {
  return (
    <Reveal>
      <section className="quiz-sec" id="quiz">
        <div className="quiz-wrap">
          <div className="quiz-header">
            <div className="quiz-badge">✦ AI Compatibility Quiz</div>
            <h2 className="sec-title quiz-header-title">
              Find your <span className="t">perfect batch.</span>
            </h2>
            <p className="quiz-header-sub">
              12 questions. 4 minutes. Age first, then our AI reads the real you between the lines.
            </p>
          </div>
          <QuizWidget
            key={quizKey}
            onComplete={onComplete}
            delegateResults={delegateResults}
          />
        </div>
      </section>
    </Reveal>
  )
}
