'use client'

import { BOOKING_STAGES, type BookingStepState } from '@/lib/booking-stages'

interface BookingPipelineProps {
  stageIndex: number
  completedThrough?: number
  stepStates?: BookingStepState[]
  status: string
}

export default function BookingPipeline({
  stageIndex,
  completedThrough,
  stepStates,
  status,
}: BookingPipelineProps) {
  if (status === 'rejected') {
    return (
      <div className="booking-pipeline booking-pipeline-rejected">
        <p className="booking-pipeline-msg">
          Your application was not approved for this departure. Our team will contact you about
          next steps or a refund if applicable.
        </p>
      </div>
    )
  }

  const doneThrough = completedThrough ?? stageIndex

  return (
    <ol className="booking-pipeline">
      {BOOKING_STAGES.map((stage, i) => {
        const explicit = stepStates?.[i]
        const done = explicit ? explicit === 'done' : i <= doneThrough
        const current = explicit ? explicit === 'current' : i === stageIndex
        return (
          <li
            key={stage.id}
            className={`booking-step${done ? ' done' : ''}${current ? ' current' : ''}`}
          >
            <span className="booking-step-dot">{done ? '✓' : i + 1}</span>
            <span className="booking-step-label">{stage.label}</span>
          </li>
        )
      })}
    </ol>
  )
}
