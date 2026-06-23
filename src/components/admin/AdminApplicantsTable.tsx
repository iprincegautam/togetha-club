'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Badge from '@/components/ui/Badge'
import {
  adminApplicantHref,
  filterAdminApplicants,
  filtersToSearchParams,
  parseAdminApplicantFilters,
  type GenderFilter,
  type LeadFilter,
  uniqueDepartureLabels,
} from '@/lib/admin-applicant-filters'
import type { ApplicantStatus } from '@/types/applicant'

export interface AdminApplicantRow {
  id: string
  name: string | null
  email: string
  phone: string | null
  gender: 'm' | 'f' | null
  batchSlug: string | null
  batchName: string | null
  quizScore: number | null
  status: ApplicantStatus
  createdAt: string
  promoCode: string | null
  priorityReview: boolean
  leadSource: string | null
  isQuizLead: boolean
  departureLabel: string | null
}

function canShowCredentialsAction(status: ApplicantStatus): boolean {
  return status === 'deposit_paid' || status === 'paid'
}

interface AdminApplicantsTableProps {
  applicants: AdminApplicantRow[]
}

const STATUS_OPTIONS: { value: ApplicantStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid in full' },
  { value: 'deposit_paid', label: 'Deposit paid' },
  { value: 'rejected', label: 'Rejected' },
]

function statusBadgeColor(status: ApplicantStatus): 'teal' | 'rose' | 'gold' | 'ink' {
  switch (status) {
    case 'paid':
    case 'deposit_paid':
    case 'approved':
      return 'teal'
    case 'rejected':
      return 'rose'
    default:
      return 'gold'
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminApplicantsTable({ applicants }: AdminApplicantsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filters = useMemo(
    () => parseAdminApplicantFilters(searchParams),
    [searchParams]
  )

  const [nameDraft, setNameDraft] = useState(filters.name)
  const [emailDraft, setEmailDraft] = useState(filters.email)

  useEffect(() => {
    setNameDraft(filters.name)
    setEmailDraft(filters.email)
  }, [filters.name, filters.email])

  const updateFilters = useCallback(
    (next: Partial<typeof filters>) => {
      const merged = { ...filters, ...next }
      const query = filtersToSearchParams(merged).toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [filters, pathname, router]
  )

  const applyTextFilters = () => {
    updateFilters({ name: nameDraft, email: emailDraft })
  }

  const departureOptions = useMemo(() => uniqueDepartureLabels(applicants), [applicants])

  const filtered = useMemo(
    () => filterAdminApplicants(applicants, filters),
    [applicants, filters]
  )

  const counts = useMemo(() => {
    const pending = applicants.filter((a) => a.status === 'pending').length
    const paid = applicants.filter((a) => a.status === 'paid').length
    const depositPaid = applicants.filter((a) => a.status === 'deposit_paid').length
    const quizLeads = applicants.filter((a) => a.isQuizLead).length
    const callable = applicants.filter((a) => Boolean(a.phone)).length
    const byBatch: Record<string, number> = {}
    applicants.forEach((a) => {
      const key = a.batchSlug ?? 'unknown'
      byBatch[key] = (byBatch[key] ?? 0) + 1
    })
    return { pending, paid, depositPaid, quizLeads, callable, byBatch, total: applicants.length }
  }, [applicants])

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.lead !== 'all' ||
    filters.gender !== 'all' ||
    Boolean(filters.name) ||
    Boolean(filters.email) ||
    Boolean(filters.date)

  return (
    <div className="admin-dashboard">
      <div className="admin-stat-grid">
        <div className="admin-stat">
          <div className="admin-stat-num">{counts.total}</div>
          <div className="admin-stat-label">Total applicants</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-num">{counts.pending}</div>
          <div className="admin-stat-label">Pending</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-num">{counts.depositPaid}</div>
          <div className="admin-stat-label">Deposit paid</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-num">{counts.paid}</div>
          <div className="admin-stat-label">Paid in full</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-num">{counts.quizLeads}</div>
          <div className="admin-stat-label">Quiz leads</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-num">{counts.callable}</div>
          <div className="admin-stat-label">Has phone</div>
        </div>
        {Object.entries(counts.byBatch).map(([slug, count]) => (
          <div className="admin-stat" key={slug}>
            <div className="admin-stat-num">{count}</div>
            <div className="admin-stat-label">{slug}</div>
          </div>
        ))}
      </div>

      <div className="admin-filter admin-filter-row">
        <div>
          <label className="apply-label" htmlFor="name-filter">
            Name
          </label>
          <input
            id="name-filter"
            className="apply-input admin-filter-select"
            type="search"
            placeholder="e.g. Ishan"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyTextFilters()}
          />
        </div>
        <div>
          <label className="apply-label" htmlFor="email-filter">
            Email
          </label>
          <input
            id="email-filter"
            className="apply-input admin-filter-select"
            type="search"
            placeholder="e.g. rathiishan69@gmail.com"
            value={emailDraft}
            onChange={(e) => setEmailDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyTextFilters()}
          />
        </div>
        <div>
          <label className="apply-label" htmlFor="date-filter">
            Travel date
          </label>
          <select
            id="date-filter"
            className="apply-select admin-filter-select"
            value={filters.date}
            onChange={(e) => updateFilters({ date: e.target.value })}
          >
            <option value="">All departure dates</option>
            {departureOptions.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="apply-label" htmlFor="gender-filter">
            Gender
          </label>
          <select
            id="gender-filter"
            className="apply-select admin-filter-select"
            value={filters.gender}
            onChange={(e) => updateFilters({ gender: e.target.value as GenderFilter })}
          >
            <option value="all">All genders</option>
            <option value="m">Male</option>
            <option value="f">Female</option>
          </select>
        </div>
        <div>
          <label className="apply-label" htmlFor="status-filter">
            Filter by status
          </label>
          <select
            id="status-filter"
            className="apply-select admin-filter-select"
            value={filters.status}
            onChange={(e) =>
              updateFilters({ status: e.target.value as ApplicantStatus | 'all' })
            }
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="apply-label" htmlFor="lead-filter">
            Lead type
          </label>
          <select
            id="lead-filter"
            className="apply-select admin-filter-select"
            value={filters.lead}
            onChange={(e) => updateFilters({ lead: e.target.value as LeadFilter })}
          >
            <option value="all">All leads</option>
            <option value="quiz_leads">Quiz leads (score + phone)</option>
            <option value="callable">Has phone only</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <button type="button" className="admin-btn" onClick={applyTextFilters}>
            Apply search
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              className="admin-link-btn"
              onClick={() => {
                setNameDraft('')
                setEmailDraft('')
                router.replace(pathname, { scroll: false })
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Travel date</th>
              <th>Source</th>
              <th>Gender</th>
              <th>Batch</th>
              <th>Promo</th>
              <th>Priority</th>
              <th>Quiz score</th>
              <th>Status</th>
              <th>Applied</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={13} className="admin-table-empty">
                  No applicants found.
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const detailHref = adminApplicantHref(row.id, filters)
                return (
                  <tr key={row.id}>
                    <td>
                      <Link href={detailHref} className="admin-row-link">
                        {row.name || '—'}
                      </Link>
                    </td>
                    <td>{row.email}</td>
                    <td>{row.phone ?? '—'}</td>
                    <td>{row.departureLabel ?? '—'}</td>
                    <td>{row.leadSource ?? (row.isQuizLead ? 'quiz' : '—')}</td>
                    <td>{row.gender === 'm' ? 'M' : row.gender === 'f' ? 'F' : '—'}</td>
                    <td>{row.batchName || row.batchSlug || '—'}</td>
                    <td>
                      {row.promoCode ? <code className="admin-code">{row.promoCode}</code> : '—'}
                    </td>
                    <td>{row.priorityReview ? 'Yes' : '—'}</td>
                    <td>{row.quizScore ?? '—'}</td>
                    <td>
                      <Badge color={statusBadgeColor(row.status)}>{row.status}</Badge>
                    </td>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>
                      <Link href={detailHref} className="admin-inline-link">
                        View →
                      </Link>
                      {canShowCredentialsAction(row.status) && (
                        <>
                          {' · '}
                          <Link href={`${detailHref}#member-portal`} className="admin-inline-link">
                            Credentials
                          </Link>
                        </>
                      )}
                      {(row.status === 'deposit_paid' || row.status === 'paid') && (
                        <>
                          {' · '}
                          <Link href={`${detailHref}#balance-email`} className="admin-inline-link">
                            Payments
                          </Link>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
