'use client'

import { useRouter } from 'next/navigation'
import SectionLabel from '@/components/ui/SectionLabel'
import { ROUTES } from '@/constants/routes'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'

const STEPS = [
  {
    num: '01',
    icon: '📋',
    title: 'Take the quiz & apply',
    desc: '10 questions that reveal more than a year on an app. Our AI uses your answers to build your compatibility profile. Then we read your application personally.',
    action: 'quiz' as const,
  },
  {
    num: '02',
    icon: '🤖',
    title: 'AI builds your batch',
    desc: "Once approved, the algorithm places you in the batch where your compatibility score is highest. You don't know who's in it. That's intentional.",
    action: null,
  },
  {
    num: '03',
    icon: '🏔️',
    title: 'Go to the mountains',
    desc: 'Manali → Kasol → Sissu. 5 nights, 6 days. Ice breakers, bonfires, sunrises, real conversations. The mountains do the rest.',
    action: 'batches' as const,
  },
  {
    num: '04',
    icon: '💛',
    title: 'Find your person',
    desc: 'No roses. No eliminations. No cameras. Just 24 verified singles and six days. What happens next is entirely yours.',
    action: null,
  },
] as const

export default function HowItWorksSection() {
  const scrollTo = useSmoothScroll()
  const router = useRouter()

  const handleStepClick = (action: 'quiz' | 'batches' | null) => {
    if (action === 'quiz') scrollTo('quiz')
    if (action === 'batches') router.push(ROUTES.batches)
  }

  return (
    <section className="sec" id="how">
      <div className="sec-inner">
        <SectionLabel>How It Works</SectionLabel>
        <h2 className="sec-title">
          Four steps to <span className="r">magic.</span>
        </h2>
        <p className="sec-sub sec-sub-tight">
          Simple enough to explain at a dinner party.
        </p>
        <div className="steps-grid">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className={`step${step.action ? ' step-clickable' : ''}`}
              onClick={step.action ? () => handleStepClick(step.action) : undefined}
              onKeyDown={
                step.action
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleStepClick(step.action)
                      }
                    }
                  : undefined
              }
              role={step.action ? 'button' : undefined}
              tabIndex={step.action ? 0 : undefined}
            >
              <div className="step-num">{step.num}</div>
              <div className="step-icon">{step.icon}</div>
              <div className="step-title">{step.title}</div>
              <div className="step-desc">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
