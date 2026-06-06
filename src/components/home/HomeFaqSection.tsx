'use client'

import Link from 'next/link'
import FAQAccordion from '@/components/batches/FAQAccordion'
import SectionLabel from '@/components/ui/SectionLabel'
import { HOME_FAQ_ITEMS } from '@/constants/home-faq'
import { ROUTES } from '@/constants/routes'
import { useScrollReveal } from '@/hooks/useScrollReveal'

export default function HomeFaqSection() {
  const ref = useScrollReveal<HTMLElement>()

  return (
    <section ref={ref} className="sec home-faq-sec reveal" id="faq">
      <div className="sec-inner">
        <SectionLabel>FAQ</SectionLabel>
        <h2 className="sec-title">
          Questions we get <span className="t">before</span> people apply.
        </h2>
        <p className="sec-sub sec-sub-tight">
          Still unsure?{' '}
          <Link href={ROUTES.match} className="home-faq-inline-link">
            Try the AI Match Lab
          </Link>
          , read our{' '}
          <Link href={ROUTES.blog} className="home-faq-inline-link">
            journal
          </Link>
          , or{' '}
          <Link href={ROUTES.contact} className="home-faq-inline-link">
            write to us
          </Link>
          .
        </p>
        <div className="home-faq-panel">
          <FAQAccordion items={[...HOME_FAQ_ITEMS]} />
        </div>
      </div>
    </section>
  )
}
