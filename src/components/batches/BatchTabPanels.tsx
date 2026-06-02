import FAQAccordion from '@/components/batches/FAQAccordion'

export type ActivityTag = string | { text: string; variant?: 'highlight' | 'rose' | 'gold' }

export interface ItineraryDay {
  num: number
  location: string
  title: string
  activities: ActivityTag[]
}

export interface IncludeItem {
  icon: string
  title: string
  desc: string
}

export interface VibeCardData {
  icon: string
  title: string
  desc: string
}

export interface ReviewData {
  text: string
  initials: string
  avatarClass: 'av-teal' | 'av-rose' | 'av-gold'
  name: string
  sub: string
}

export interface PolicyData {
  title: string
  text: string
}

function activityClass(variant?: string): string {
  if (variant === 'highlight') return 'activity-tag highlight'
  if (variant === 'rose') return 'activity-tag rose'
  if (variant === 'gold') return 'activity-tag gold'
  return 'activity-tag'
}

function renderActivity(tag: ActivityTag, roseAccent?: boolean) {
  if (typeof tag === 'string') {
    return <span className="activity-tag">{tag}</span>
  }
  const cls = tag.variant === 'highlight' && roseAccent
    ? 'activity-tag highlight rose-highlight'
    : activityClass(tag.variant)
  return (
    <span
      key={tag.text}
      className={cls}
      style={tag.variant === 'highlight' && roseAccent ? { background: 'var(--rose)' } : undefined}
    >
      {tag.text}
    </span>
  )
}

export function ItineraryTab({
  title,
  days,
  roseAccent,
}: {
  title: string
  days: ItineraryDay[]
  roseAccent?: boolean
}) {
  return (
    <>
      <div className="section-label">The Journey</div>
      <h2 className="itinerary-title">{title}</h2>
      {days.map((day) => (
        <div className="day-card" key={day.num}>
          <div
            className="day-num-col"
            style={roseAccent ? { background: 'rgba(212,81,106,0.08)' } : undefined}
          >
            <div className="day-num" style={roseAccent ? { color: 'var(--rose)' } : undefined}>
              {day.num}
            </div>
            <div className="day-word">Day</div>
          </div>
          <div className="day-content">
            <div className="day-location" style={roseAccent ? { color: 'var(--rose)' } : undefined}>
              {day.location}
            </div>
            <div className="day-title">{day.title}</div>
            <div className="day-activities">
              {day.activities.map((tag, i) => (
                <span key={i}>{renderActivity(tag, roseAccent)}</span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export function IncludesTab({
  label,
  title,
  items,
  notIncluded,
}: {
  label: string
  title: string
  items: IncludeItem[]
  notIncluded?: string[]
}) {
  return (
    <>
      <div className="section-label">{label}</div>
      <h2 className="section-title">{title}</h2>
      <div className="includes-grid">
        {items.map((item) => (
          <div className="include-item" key={item.title}>
            <div className="include-icon">{item.icon}</div>
            <div>
              <div className="include-title">{item.title}</div>
              <div className="include-desc">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
      {notIncluded && notIncluded.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div className="section-label">Not included</div>
          {notIncluded.map((item) => (
            <div className="not-include-item" key={item}>
              <span className="not-x">✕</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export function VibeTab({
  label,
  title,
  intro,
  cards,
}: {
  label: string
  title: string
  intro: string
  cards: VibeCardData[]
}) {
  return (
    <>
      <div className="section-label">{label}</div>
      <h2 className="section-title">{title}</h2>
      <p className="vibe-intro">
        {intro.split('\n\n').map((part, i, arr) => (
          <span key={i}>
            {part}
            {i < arr.length - 1 ? (
              <>
                <br />
                <br />
              </>
            ) : null}
          </span>
        ))}
      </p>
      <div className="vibe-grid">
        {cards.map((card) => (
          <div className="vibe-card" key={card.title}>
            <div className="vibe-icon">{card.icon}</div>
            <div className="vibe-title">{card.title}</div>
            <div className="vibe-desc">{card.desc}</div>
          </div>
        ))}
      </div>
    </>
  )
}

export function ReviewsTab({
  label,
  title,
  reviews,
}: {
  label: string
  title: string
  reviews: ReviewData[]
}) {
  return (
    <>
      <div className="section-label">{label}</div>
      <h2 className="section-title">{title}</h2>
      <div className="review-grid">
        {reviews.map((review) => (
          <div className="review-card" key={review.name}>
            <div className="review-quote-mark">&ldquo;</div>
            <div className="review-text">{review.text}</div>
            <div className="review-author">
              <div className={`review-avatar ${review.avatarClass}`}>{review.initials}</div>
              <div>
                <div className="review-name">{review.name}</div>
                <div className="review-sub">{review.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export function PolicyTab({
  label,
  title,
  policies,
}: {
  label: string
  title: string
  policies: PolicyData[]
}) {
  return (
    <>
      <div className="section-label">{label}</div>
      <h2 className="section-title">{title}</h2>
      <div className="policy-grid">
        {policies.map((policy) => (
          <div className="policy-card" key={policy.title}>
            <div className="policy-title">{policy.title}</div>
            <div className="policy-text">{policy.text}</div>
          </div>
        ))}
      </div>
    </>
  )
}

export function FAQTab({
  label,
  title,
  items,
}: {
  label: string
  title: string
  items: { question: string; answer: string }[]
}) {
  return (
    <>
      <div className="section-label">{label}</div>
      <h2 className="section-title">{title}</h2>
      <FAQAccordion items={items} />
    </>
  )
}
