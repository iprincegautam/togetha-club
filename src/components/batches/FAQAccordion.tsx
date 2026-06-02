'use client'

import { useState } from 'react'

interface FAQAccordionProps {
  items: { question: string; answer: string }[]
}

export default function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  return (
    <div>
      {items.map((item, index) => {
        const isOpen = openIndex === index
        return (
          <div key={item.question} className={`faq-item${isOpen ? ' open' : ''}`}>
            <button type="button" className="faq-q" onClick={() => toggle(index)}>
              {item.question}
              <span className="faq-toggle">+</span>
            </button>
            <div className={`faq-panel${isOpen ? ' open' : ''}`}>
              <div className="faq-a">{item.answer}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
