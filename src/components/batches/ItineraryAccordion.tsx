'use client'

import { useState } from 'react'
import type { ActivityTag, ItineraryDay } from '@/components/batches/BatchTabPanels'

function activityClass(variant?: string): string {
  if (variant === 'highlight') return 'activity-tag highlight'
  if (variant === 'rose') return 'activity-tag rose'
  if (variant === 'gold') return 'activity-tag gold'
  return 'activity-tag'
}

function ActivityChip({ tag }: { tag: ActivityTag }) {
  if (typeof tag === 'string') return <span className="activity-tag">{tag}</span>
  return <span className={activityClass(tag.variant)}>{tag.text}</span>
}

export default function ItineraryAccordion({
  title,
  days,
  roseAccent,
}: {
  title: string
  days: ItineraryDay[]
  roseAccent?: boolean
}) {
  const [open, setOpen] = useState<number | null>(days[0]?.num ?? null)

  const toggle = (num: number) => setOpen((prev) => (prev === num ? null : num))

  return (
    <>
      <div className="section-label">The Journey</div>
      <h2 className="itinerary-title">{title}</h2>
      <div className="itin-day-list">
        {days.map((day) => {
          const isOpen = open === day.num
          return (
            <div className={`itin-day${isOpen ? ' open' : ''}`} key={day.num}>
              <button
                type="button"
                className="itin-day-head"
                aria-expanded={isOpen}
                onClick={() => toggle(day.num)}
              >
                <span
                  className={`itin-day-num-col${roseAccent ? ' rose-bg' : ''}`}
                  aria-hidden
                >
                  <span className={`day-num${roseAccent ? ' rose' : ''}`}>{day.num}</span>
                  <span className="day-word">Day</span>
                </span>
                <span className="itin-day-heading">
                  <span className={`day-location${roseAccent ? ' rose' : ''}`}>{day.location}</span>
                  <span className="day-title">{day.title}</span>
                </span>
                <span className="itin-day-caret" aria-hidden>
                  ▾
                </span>
              </button>
              {isOpen && (
                <div className="itin-day-body">
                  <div className="day-activities">
                    {day.activities.map((tag, i) => (
                      <ActivityChip key={i} tag={tag} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
