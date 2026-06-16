'use client'

import BatchVideoTestimonials from '@/components/batches/BatchVideoTestimonials'
import { getBatchVideoTestimonials } from '@/constants/batch-testimonials'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const items = getBatchVideoTestimonials('batch-a')

export default function HomeVideoTestimonialsSection() {
  const ref = useScrollReveal<HTMLElement>()

  return (
    <section ref={ref} className="sec home-video-sec reveal">
      <BatchVideoTestimonials items={items} accentColor="var(--teal-stamp)" />
    </section>
  )
}
