'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { CAREERS_PROGRAM } from '@/content/careers/program'
import { getAllCareersRoles } from '@/content/careers/roles'
import type { InternTrackSlug } from '@/content/careers/types'
import { ROUTES } from '@/constants/routes'

type CareersLandingProps = {
  initialOpen?: InternTrackSlug | null
}

export default function CareersLanding({ initialOpen = null }: CareersLandingProps) {
  const roles = getAllCareersRoles()
  const [openSlug, setOpenSlug] = useState<InternTrackSlug | null>(initialOpen)

  const toggle = useCallback((slug: InternTrackSlug) => {
    setOpenSlug((current) => (current === slug ? null : slug))
  }, [])

  const whyParagraphs = CAREERS_PROGRAM.whyText.split('\n\n')

  return (
    <div className="careers-shell">
      <p className="careers-eyebrow">✦ {CAREERS_PROGRAM.eyebrow} ✦</p>

      <h1 className="careers-hero-title">
        We&apos;re building
        <br />
        India&apos;s first matchmaking travel club
      </h1>

      <p className="careers-hero-sub">{CAREERS_PROGRAM.heroSub}</p>

      <div className="careers-pill-row">
        {CAREERS_PROGRAM.pills.map((pill) => (
          <span
            key={pill.label}
            className={pill.gold ? 'careers-pill careers-pill--accent' : 'careers-pill'}
          >
            {pill.label}
          </span>
        ))}
      </div>

      <hr className="careers-divider" />

      <h2 className="careers-section-head">{CAREERS_PROGRAM.rolesSectionTitle}</h2>
      <p className="careers-section-sub">{CAREERS_PROGRAM.rolesSectionSub}</p>

      {roles.map((role) => {
        const isOpen = openSlug === role.slug
        return (
          <div
            key={role.slug}
            className={`careers-role-card${isOpen ? ' careers-role-card--open' : ''}`}
            id={role.slug}
          >
            <button
              type="button"
              className="careers-role-header"
              onClick={() => toggle(role.slug)}
              aria-expanded={isOpen}
            >
              <div className="careers-role-glyph">{role.glyph}</div>
              <div className="careers-role-meta">
                <p className="careers-role-label">{role.categoryLabel}</p>
                <p className="careers-role-title">{role.title}</p>
                <p className="careers-role-tagline">{role.tagline}</p>
              </div>
              <span
                className={`careers-chevron${isOpen ? ' careers-chevron--open' : ''}`}
                aria-hidden
              >
                ▼
              </span>
            </button>

            {isOpen && (
              <div className="careers-role-body">
                <div className="careers-comp-row careers-comp-row--role">
                  {CAREERS_PROGRAM.comp.map((cell) => (
                    <div key={cell.key} className="careers-comp-cell">
                      <span className="careers-comp-val">{cell.value}</span>
                      <span className="careers-comp-key">{cell.key}</span>
                    </div>
                  ))}
                </div>

                <p className="careers-sub-label">What this is</p>
                <p className="careers-body-text">{role.whatThisIs}</p>

                <p className="careers-sub-label">What you&apos;ll own</p>
                <ul className="careers-jd-list">
                  {role.whatYouWillOwn.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <p className="careers-sub-label">Who we&apos;re looking for</p>
                <ul className="careers-jd-list">
                  {role.whoWeLookingFor.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <p className="careers-sub-label">{role.toolsLabel}</p>
                <div className="careers-tag-row">
                  {role.toolTags.map((tag) => (
                    <span key={tag} className="careers-tag">
                      {tag}
                    </span>
                  ))}
                </div>

                {role.teamCollaboration && role.teamCollaboration.length > 0 && (
                  <>
                    <p className="careers-sub-label">How you work with the team</p>
                    <ul className="careers-team-list">
                      {role.teamCollaboration.map((item) => (
                        <li key={item.title} className="careers-team-item">
                          <span className="careers-team-glyph" aria-hidden>
                            {item.glyph}
                          </span>
                          <div>
                            <p className="careers-team-title">{item.title}</p>
                            <p className="careers-body-text">{item.description}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                <Link href={ROUTES.careersApplyTrack(role.slug)} className="careers-apply-link">
                  Apply for this role →
                </Link>
              </div>
            )}
          </div>
        )
      })}

      <div className="careers-why-block">
        <p className="careers-why-title">{CAREERS_PROGRAM.whyTitle}</p>
        <p className="careers-why-text">
          {whyParagraphs.map((para, i) => (
            <span key={i}>
              {i > 0 && (
                <>
                  <br />
                  <br />
                </>
              )}
              {para}
            </span>
          ))}
        </p>
      </div>

      <p className="careers-footer-line">
        ✦{' '}
        <Link href={ROUTES.careers} className="careers-footer-link">
          Join the founding team
        </Link>{' '}
        · {CAREERS_PROGRAM.footerLine} ✦
      </p>
    </div>
  )
}
