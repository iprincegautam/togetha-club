import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import '@/components/legal/legal.css'

export interface LegalSection {
  title: string
  paragraphs?: string[]
  list?: string[]
}

interface LegalDocumentProps {
  eyebrow: string
  title: string
  intro: string
  sections: LegalSection[]
  lastUpdated: string
}

export default function LegalDocument({
  eyebrow,
  title,
  intro,
  sections,
  lastUpdated,
}: LegalDocumentProps) {
  return (
    <div className="legal-page">
      <div className="legal-shell">
        <p className="legal-eyebrow">{eyebrow}</p>
        <h1 className="legal-title">{title}</h1>
        <p className="legal-updated">Last updated: {lastUpdated}</p>
        <p className="legal-intro">{intro}</p>

        <div className="legal-body">
          {sections.map((section) => (
            <section key={section.title} className="legal-section">
              <h2>{section.title}</h2>
              {section.paragraphs?.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
              {section.list && (
                <ul>
                  {section.list.map((item) => (
                    <li key={item.slice(0, 40)}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <p className="legal-foot">
          <Link href={ROUTES.home}>← Back to home</Link>
          {' · '}
          <Link href={ROUTES.contact}>Contact us</Link>
        </p>
      </div>
    </div>
  )
}
