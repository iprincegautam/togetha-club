import FAQAccordion from '@/components/batches/FAQAccordion'

type BatchProductFaqProps = {
  items: { question: string; answer: string }[]
  roseAccent?: boolean
}

export default function BatchProductFaq({ items, roseAccent }: BatchProductFaqProps) {
  if (items.length === 0) return null

  return (
    <section className={`batch-pdp-section batch-faq-section${roseAccent ? ' batch-faq-section--rose' : ''}`}>
      <div className="batch-pdp-section-head">
        <p className="batch-pdp-eyebrow">✦ FAQ ✦</p>
        <h2 className="batch-pdp-title">Questions before you apply</h2>
        <p className="batch-pdp-sub">Everything people ask us before locking a spot.</p>
      </div>
      <div className="batch-faq-panel">
        <FAQAccordion items={items} />
      </div>
    </section>
  )
}
