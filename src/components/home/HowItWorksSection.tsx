'use client'

import { useRouter } from 'next/navigation'
import Reveal from '@/components/ui/Reveal'
import SectionLabel from '@/components/ui/SectionLabel'
import { ROUTES } from '@/constants/routes'
import { HOW_IT_WORKS_GLYPH } from '@/constants/brand-glyphs'

const STEPS = [
  {
    num: '01',
    icon: HOW_IT_WORKS_GLYPH.quiz,
    title: 'Take the quiz',
    desc: '12 questions — age first, then personality. Our AI builds your compatibility profile and shows your best batch fit.',
    action: 'match' as const,
  },
  {
    num: '02',
    icon: HOW_IT_WORKS_GLYPH.ai,
    title: 'Book your slot',
    desc: 'Pick your Friday departure, pay on the website, and lock your spot. 12 boys and 12 girls — gender balance guaranteed.',
    action: 'batches' as const,
  },
  {
    num: '03',
    icon: HOW_IT_WORKS_GLYPH.mountains,
    title: 'AI matches your batch',
    desc: "The algorithm places you where your compatibility score is highest. You meet your group on Day 1 — that's intentional.",
    action: null,
  },
  {
    num: '04',
    icon: HOW_IT_WORKS_GLYPH.connection,
    title: 'Go to the mountains',
    desc: 'Manali → Sissu → Kasol. 3 nights, 4 days. Ice breakers, bonfires, real conversations. What happens next is entirely yours.',
    action: null,
  },
] as const

export default function HowItWorksSection() {
  const router = useRouter()

  const handleStepClick = (action: 'match' | 'batches' | null) => {
    if (action === 'match') router.push(ROUTES.match)
    if (action === 'batches') router.push(ROUTES.batches)
  }

  return (
    <Reveal>
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
              <div className="step-icon brand-glyph">{step.icon}</div>
              <div className="step-title">{step.title}</div>
              <div className="step-desc">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
    </Reveal>
  )
}
