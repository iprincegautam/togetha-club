'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import Badge from '@/components/ui/Badge'
import { ROUTES } from '@/constants/routes'
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

type LeadFilter = 'all' | 'quiz_leads' | 'callable'

export default function AdminApplicantsTable({ applicants }: AdminApplicantsTableProps) {
  const [statusFilter, setStatusFilter] = useState<ApplicantStatus | 'all'>('all')
  const [leadFilter, setLeadFilter] = useState<LeadFilter>('all')

  const filtered = useMemo(() => {
    let rows = applicants
    if (statusFilter !== 'all') {
      rows = rows.filter((a) => a.status === statusFilter)
    }
    if (leadFilter === 'quiz_leads') {
      rows = rows.filter((a) => a.isQuizLead)
    }
    if (leadFilter === 'callable') {
      rows = rows.filter((a) => Boolean(a.phone))
    }
    return rows
  }, [applicants, statusFilter, leadFilter])

  const counts = useMemo(() => {
    const pending = applicants.filter((a) => a.status === 'pending').length
    const paid = applicants.filter((a) => a.status === 'paid').length
    const quizLeads = applicants.filter((a) => a.isQuizLead).length
    const callable = applicants.filter((a) => Boolean(a.phone)).length
    const byBatch: Record<string, number> = {}
    applicants.forEach((a) => {
      const key = a.batchSlug ?? 'unknown'
      byBatch[key] = (byBatch[key] ?? 0) + 1
    })
    return { pending, paid, quizLeads, callable, byBatch, total: applicants.length }
  }, [applicants])

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
          <div className="admin-stat-num">{counts.paid}</div>
          <div className="admin-stat-label">Paid</div>
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
          <label className="apply-label" htmlFor="status-filter">
            Filter by status
          </label>
          <select
            id="status-filter"
            className="apply-select admin-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ApplicantStatus | 'all')}
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
            value={leadFilter}
            onChange={(e) => setLeadFilter(e.target.value as LeadFilter)}
          >
            <option value="all">All leads</option>
            <option value="quiz_leads">Quiz leads (score + phone)</option>
            <option value="callable">Has phone only</option>
          </select>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
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
                <td colSpan={12} className="admin-table-empty">
                  No applicants found.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link href={ROUTES.adminApplicant(row.id)} className="admin-row-link">
                      {row.name || '—'}
                    </Link>
                  </td>
                  <td>{row.email}</td>
                  <td>{row.phone ?? '—'}</td>
                  <td>{row.leadSource ?? (row.isQuizLead ? 'quiz' : '—')}</td>
                  <td>{row.gender === 'm' ? 'M' : row.gender === 'f' ? 'F' : '—'}</td>
                  <td>{row.batchName || row.batchSlug || '—'}</td>
                  <td>{row.promoCode ? <code className="admin-code">{row.promoCode}</code> : '—'}</td>
                  <td>{row.priorityReview ? 'Yes' : '—'}</td>
                  <td>{row.quizScore ?? '—'}</td>
                  <td>
                    <Badge color={statusBadgeColor(row.status)}>{row.status}</Badge>
                  </td>
                  <td>{formatDate(row.createdAt)}</td>
                  <td>
                    <Link href={ROUTES.adminApplicant(row.id)} className="admin-inline-link">
                      View →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
