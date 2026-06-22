'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { getAllCareersRoles, isInternTrackSlug } from '@/content/careers/roles'
import type { InternTrackSlug } from '@/content/careers/types'

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

export default function InternApplicationForm() {
  const searchParams = useSearchParams()
  const preselectedTrack = searchParams.get('track')
  const defaultTrack = useMemo(() => {
    if (preselectedTrack && isInternTrackSlug(preselectedTrack)) {
      return preselectedTrack
    }
    return ''
  }, [preselectedTrack])

  const roles = getAllCareersRoles()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [college, setCollege] = useState('')
  const [course, setCourse] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState<'2nd' | '3rd' | ''>('')
  const [track, setTrack] = useState<InternTrackSlug | ''>(defaultTrack)
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [whyTogetha, setWhyTogetha] = useState('')
  const [resume, setResume] = useState<File | null>(null)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!track) {
      setStatus('error')
      setErrorMsg('Please select a role.')
      return
    }

    if (!yearOfStudy) {
      setStatus('error')
      setErrorMsg('Please select your year of study.')
      return
    }

    if (!resume) {
      setStatus('error')
      setErrorMsg('Please upload your resume (PDF).')
      return
    }

    setStatus('loading')

    try {
      const formData = new FormData()
      formData.append('fullName', fullName)
      formData.append('email', email)
      formData.append('phone', phone)
      formData.append('college', college)
      formData.append('course', course)
      formData.append('yearOfStudy', yearOfStudy)
      formData.append('track', track)
      formData.append('portfolioUrl', portfolioUrl)
      formData.append('whyTogetha', whyTogetha)
      formData.append('resume', resume)

      const res = await fetch('/api/careers/apply', {
        method: 'POST',
        body: formData,
      })

      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.')
      }

      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="apply-card">
        <p className="apply-eyebrow" style={{ textAlign: 'left' }}>
          ✦ Application received
        </p>
        <h2 className="apply-title" style={{ fontSize: '1.75rem', textAlign: 'left' }}>
          Check your email
        </h2>
        <p className="apply-sub" style={{ textAlign: 'left', marginBottom: 0 }}>
          We sent your written questions and take-home assignment to <strong>{email}</strong>.
          Reply within 48 hours with your PDF or Google Doc link. If you do not see it in 10
          minutes, check spam.
        </p>
      </div>
    )
  }

  return (
    <form className="apply-card" onSubmit={handleSubmit}>
      <div className="apply-field">
        <label className="apply-label" htmlFor="fullName">
          Full name *
        </label>
        <input
          id="fullName"
          className="apply-input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          disabled={status === 'loading'}
        />
      </div>

      <div className="apply-field">
        <label className="apply-label" htmlFor="email">
          Email *
        </label>
        <input
          id="email"
          type="email"
          className="apply-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === 'loading'}
        />
      </div>

      <div className="apply-field">
        <label className="apply-label" htmlFor="phone">
          Phone (optional)
        </label>
        <input
          id="phone"
          type="tel"
          className="apply-input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={status === 'loading'}
        />
      </div>

      <div className="apply-field">
        <label className="apply-label" htmlFor="college">
          College *
        </label>
        <input
          id="college"
          className="apply-input"
          value={college}
          onChange={(e) => setCollege(e.target.value)}
          required
          disabled={status === 'loading'}
        />
      </div>

      <div className="apply-field">
        <label className="apply-label" htmlFor="course">
          Course / degree
        </label>
        <input
          id="course"
          className="apply-input"
          placeholder="e.g. B.Des Communication Design"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          disabled={status === 'loading'}
        />
      </div>

      <div className="apply-field">
        <label className="apply-label" htmlFor="yearOfStudy">
          Current year *
        </label>
        <select
          id="yearOfStudy"
          className="apply-select"
          value={yearOfStudy}
          onChange={(e) => setYearOfStudy(e.target.value as '2nd' | '3rd' | '')}
          required
          disabled={status === 'loading'}
        >
          <option value="">Select year</option>
          <option value="2nd">2nd year</option>
          <option value="3rd">3rd year</option>
        </select>
        <p className="apply-error" style={{ color: 'var(--ink-mid)', marginTop: 6 }}>
          Open to 2nd- and 3rd-year students only.
        </p>
      </div>

      <div className="apply-field">
        <label className="apply-label" htmlFor="track">
          Role *
        </label>
        <select
          id="track"
          className="apply-select"
          value={track}
          onChange={(e) => setTrack(e.target.value as InternTrackSlug | '')}
          required
          disabled={status === 'loading'}
        >
          <option value="">Select role</option>
          {roles.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.title}
            </option>
          ))}
        </select>
      </div>

      <div className="apply-field">
        <label className="apply-label" htmlFor="portfolioUrl">
          Portfolio / writing samples link *
        </label>
        <input
          id="portfolioUrl"
          type="url"
          className="apply-input"
          placeholder="https://instagram.com/… or Drive, Notion, Behance, etc."
          value={portfolioUrl}
          onChange={(e) => setPortfolioUrl(e.target.value)}
          required
          disabled={status === 'loading'}
        />
      </div>

      <div className="apply-field">
        <label className="apply-label" htmlFor="whyTogetha">
          Why Togetha? (optional)
        </label>
        <textarea
          id="whyTogetha"
          className="apply-textarea"
          value={whyTogetha}
          onChange={(e) => setWhyTogetha(e.target.value)}
          disabled={status === 'loading'}
        />
      </div>

      <div className="apply-field">
        <label className="apply-label" htmlFor="resume">
          Resume (PDF, max 5MB) *
        </label>
        <input
          id="resume"
          type="file"
          className="apply-input"
          accept="application/pdf,.pdf"
          onChange={(e) => setResume(e.target.files?.[0] ?? null)}
          required
          disabled={status === 'loading'}
        />
      </div>

      <button type="submit" className="apply-submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Submitting…' : 'Submit application →'}
      </button>

      {status === 'error' && errorMsg && (
        <p className="apply-error" role="alert">
          {errorMsg}
        </p>
      )}

      <p className="apply-sub" style={{ fontSize: '0.85rem', marginTop: 16, marginBottom: 0 }}>
        After you apply, we email written questions and a 3-hour take-home. Top performers are
        considered for a PPO with ESOPs.
      </p>
    </form>
  )
}
