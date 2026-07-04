'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatPaise } from '@/lib/utils'

type Transaction = {
  id: string
  date: string
  source: 'payment' | 'commission' | 'cost'
  direction: 'in' | 'out'
  amountPaise: number
  label: string
  applicantName: string | null
  vendorName: string | null
  batchSlug: string | null
  departureLabel: string | null
}

type CostRow = {
  id: string
  costType: string
  description: string | null
  vendorName: string | null
  amountPaise: number
  incurredOn: string | null
  createdAt: string
}

type DepartureBreakdown = {
  departureId: string
  label: string
  departureDate: string | null
  status: string
  bookedPaise: number
  collectedPaise: number
  commissionsPaise: number
  operatingCostsPaise: number
  grossProfitPaise: number
  costs: CostRow[]
}

type BatchBreakdown = {
  batchSlug: string
  batchName: string
  bookedPaise: number
  collectedPaise: number
  commissionsPaise: number
  operatingCostsPaise: number
  grossProfitPaise: number
  unassignedBookedPaise: number
  unassignedCollectedPaise: number
  unassignedCommissionsPaise: number
  departures: DepartureBreakdown[]
}

type FinanceData = {
  transactions: Transaction[]
  summary: {
    bookedRevenuePaise: number
    moneyInPaise: number
    moneyOutPaise: number
    commissionsOutPaise: number
    operatingCostsPaise: number
    collectedPaise: number
    outstandingPaise: number
    grossProfitPaise: number
    bookingCount: number
  }
  breakdown: BatchBreakdown[]
  batches: { slug: string; name: string }[]
}

type DraftCost = {
  costType: 'hotel' | 'vehicle' | 'other'
  description: string
  vendorName: string
  amountRupees: string
}

const SOURCE_LABELS: Record<Transaction['source'], string> = {
  payment: 'Payment',
  commission: 'Commission',
  cost: 'Operating cost',
}

const emptyDrafts = (): DraftCost[] => [
  { costType: 'hotel', description: '', vendorName: '', amountRupees: '' },
  { costType: 'vehicle', description: '', vendorName: '', amountRupees: '' },
]

function draftPaise(draft: DraftCost): number {
  const rupees = Number(draft.amountRupees)
  if (!Number.isFinite(rupees) || rupees <= 0) return 0
  return Math.round(rupees * 100)
}

export default function AdminFinanceDashboard() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [batch, setBatch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [openDeparture, setOpenDeparture] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<DraftCost[]>(emptyDrafts())
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    const params = new URLSearchParams()
    if (batch) params.set('batch', batch)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    fetch(`/api/admin/finance/transactions?${params.toString()}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [batch, from, to])

  useEffect(() => {
    load()
  }, [load])

  const toggleDeparture = (departureId: string) => {
    setMsg('')
    setDrafts(emptyDrafts())
    setOpenDeparture((cur) => (cur === departureId ? null : departureId))
  }

  const updateDraft = (index: number, patch: Partial<DraftCost>) => {
    setDrafts((cur) => cur.map((d, i) => (i === index ? { ...d, ...patch } : d)))
  }

  const saveDrafts = async (departureId: string) => {
    const rows = drafts.filter((d) => draftPaise(d) > 0)
    if (!rows.length) {
      setMsg('Enter at least one amount before saving.')
      return
    }
    setSaving(true)
    setMsg('')
    try {
      for (const row of rows) {
        const res = await fetch(`/api/admin/finance/departures/${departureId}/costs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            costType: row.costType,
            description: row.description || null,
            vendorName: row.vendorName || null,
            amountPaise: draftPaise(row),
          }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.error ?? 'Failed to save cost')
        }
      }
      setDrafts(emptyDrafts())
      setMsg('Costs saved.')
      load()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed to save cost')
    } finally {
      setSaving(false)
    }
  }

  const deleteCost = async (departureId: string, costId: string) => {
    setMsg('')
    const res = await fetch(`/api/admin/finance/departures/${departureId}/costs/${costId}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setMsg(json.error ?? 'Failed to delete cost')
      return
    }
    load()
  }

  const summaryCards = useMemo(() => {
    const s = data?.summary
    if (!s) return []
    return [
      [`Booked revenue (${s.bookingCount} bookings)`, formatPaise(s.bookedRevenuePaise)],
      ['Collected (money in)', formatPaise(s.moneyInPaise)],
      ['Outstanding balance', formatPaise(s.outstandingPaise)],
      ['Money out', formatPaise(s.moneyOutPaise)],
      ['Gross profit (booked)', formatPaise(s.grossProfitPaise)],
    ] as const
  }, [data])

  if (loading) return <p className="admin-loading">Loading…</p>
  if (!data) return <p className="apply-error">Could not load finance data.</p>

  return (
    <div className="account-stack">
      <div className="portal-kpi-grid">
        {summaryCards.map(([label, val]) => (
          <div key={label} className="admin-stat">
            <div className="admin-stat-num">{val}</div>
            <div className="admin-stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="admin-filter admin-filter-row">
        <div className="admin-field">
          <span>Batch</span>
          <select
            className="apply-input admin-filter-select"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
          >
            <option value="">All batches</option>
            {data.batches.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-field">
          <span>From</span>
          <input
            type="date"
            className="apply-input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="admin-field">
          <span>To</span>
          <input
            type="date"
            className="apply-input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>
      <p className="admin-muted">
        Booked revenue is the trip price after discounts across confirmed bookings; collected
        is cash actually received. Gross profit = booked revenue − commissions − operating
        costs. Commissions count as money out only once paid (cash basis). The date range
        applies to money in/out and the transactions list; booked revenue, outstanding, and
        the batch breakdown are all-time.
      </p>

      {msg && <p className="admin-msg">{msg}</p>}

      {data.breakdown.map((b) => (
        <div key={b.batchSlug} className="admin-section">
          <h2 className="admin-section-title">
            {b.batchName} — gross profit {formatPaise(b.grossProfitPaise)}
          </h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Departure</th>
                  <th>Booked</th>
                  <th>Collected</th>
                  <th>Commissions</th>
                  <th>Operating costs</th>
                  <th>Gross profit</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {b.departures.map((d) => (
                  <tr key={d.departureId}>
                    <td>
                      {d.label}
                      {d.status === 'cancelled' && ' (cancelled)'}
                    </td>
                    <td>{formatPaise(d.bookedPaise)}</td>
                    <td>{formatPaise(d.collectedPaise)}</td>
                    <td>{formatPaise(d.commissionsPaise)}</td>
                    <td>{formatPaise(d.operatingCostsPaise)}</td>
                    <td>{formatPaise(d.grossProfitPaise)}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-link-btn"
                        onClick={() => toggleDeparture(d.departureId)}
                      >
                        {openDeparture === d.departureId ? 'Close' : 'Costs'}
                      </button>
                    </td>
                  </tr>
                ))}
                {(b.unassignedBookedPaise > 0 ||
                  b.unassignedCollectedPaise > 0 ||
                  b.unassignedCommissionsPaise > 0) && (
                  <tr>
                    <td className="admin-muted">Not assigned to a departure</td>
                    <td>{formatPaise(b.unassignedBookedPaise)}</td>
                    <td>{formatPaise(b.unassignedCollectedPaise)}</td>
                    <td>{formatPaise(b.unassignedCommissionsPaise)}</td>
                    <td>—</td>
                    <td>{formatPaise(b.unassignedBookedPaise - b.unassignedCommissionsPaise)}</td>
                    <td></td>
                  </tr>
                )}
                {!b.departures.length &&
                  b.unassignedBookedPaise === 0 &&
                  b.unassignedCollectedPaise === 0 &&
                  b.unassignedCommissionsPaise === 0 && (
                    <tr>
                      <td colSpan={7} className="admin-table-empty">
                        No departures or transactions yet.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>

          {b.departures
            .filter((d) => d.departureId === openDeparture)
            .map((d) => {
              const draftTotalPaise = drafts.reduce((sum, row) => sum + draftPaise(row), 0)
              return (
                <div key={d.departureId} className="admin-panel" style={{ marginTop: 16 }}>
                  <div className="admin-panel-head">
                    <h3 className="admin-panel-title">Costs — {d.label}</h3>
                  </div>

                  {d.costs.length > 0 && (
                    <div className="admin-table-wrap" style={{ marginBottom: 16 }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Vendor</th>
                            <th>Amount</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {d.costs.map((c) => (
                            <tr key={c.id}>
                              <td>{c.costType}</td>
                              <td>{c.description ?? '—'}</td>
                              <td>{c.vendorName ?? '—'}</td>
                              <td>{formatPaise(c.amountPaise)}</td>
                              <td>
                                <button
                                  type="button"
                                  className="admin-link-btn admin-danger"
                                  onClick={() => deleteCost(d.departureId, c.id)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {drafts.map((row, i) => (
                    <div key={i} className="admin-form-grid" style={{ marginBottom: 12 }}>
                      <label className="admin-field">
                        <span>Type</span>
                        <select
                          className="apply-input"
                          value={row.costType}
                          onChange={(e) =>
                            updateDraft(i, { costType: e.target.value as DraftCost['costType'] })
                          }
                        >
                          <option value="hotel">Hotel</option>
                          <option value="vehicle">Vehicle</option>
                          <option value="other">Other</option>
                        </select>
                      </label>
                      <label className="admin-field">
                        <span>Description</span>
                        <input
                          className="apply-input"
                          value={row.description}
                          placeholder="e.g. 5N stay, 24 pax"
                          onChange={(e) => updateDraft(i, { description: e.target.value })}
                        />
                      </label>
                      <label className="admin-field">
                        <span>Vendor</span>
                        <input
                          className="apply-input"
                          value={row.vendorName}
                          placeholder="e.g. Hotel Snowline"
                          onChange={(e) => updateDraft(i, { vendorName: e.target.value })}
                        />
                      </label>
                      <label className="admin-field">
                        <span>Amount (₹)</span>
                        <input
                          className="apply-input"
                          type="number"
                          min="0"
                          value={row.amountRupees}
                          placeholder="0"
                          onChange={(e) => updateDraft(i, { amountRupees: e.target.value })}
                        />
                      </label>
                    </div>
                  ))}

                  <div className="admin-panel-actions">
                    <button
                      type="button"
                      className="admin-link-btn"
                      onClick={() =>
                        setDrafts((cur) => [
                          ...cur,
                          { costType: 'other', description: '', vendorName: '', amountRupees: '' },
                        ])
                      }
                    >
                      + Add another cost
                    </button>
                    <button
                      type="button"
                      className="admin-btn"
                      disabled={saving || draftTotalPaise <= 0}
                      onClick={() => saveDrafts(d.departureId)}
                    >
                      {saving ? 'Saving…' : 'Save costs'}
                    </button>
                    <span className="admin-msg">
                      Gross profit preview: {formatPaise(d.grossProfitPaise - draftTotalPaise)}
                      {draftTotalPaise > 0 &&
                        ` (currently ${formatPaise(d.grossProfitPaise)}, unsaved costs ${formatPaise(draftTotalPaise)})`}
                    </span>
                  </div>
                </div>
              )
            })}
        </div>
      ))}

      <div className="admin-section">
        <h2 className="admin-section-title">Transactions</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>In/Out</th>
                <th>Amount</th>
                <th>Detail</th>
                <th>Who</th>
                <th>Batch / departure</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.date.slice(0, 10)}</td>
                  <td>{SOURCE_LABELS[t.source]}</td>
                  <td>{t.direction === 'in' ? '↑ In' : '↓ Out'}</td>
                  <td>
                    {t.direction === 'in' ? '+' : '−'}
                    {formatPaise(t.amountPaise)}
                  </td>
                  <td>{t.label}</td>
                  <td>{t.applicantName ?? t.vendorName ?? '—'}</td>
                  <td>
                    {t.batchSlug ?? '—'}
                    {t.departureLabel ? ` · ${t.departureLabel}` : ''}
                  </td>
                </tr>
              ))}
              {!data.transactions.length && (
                <tr>
                  <td colSpan={7} className="admin-table-empty">
                    No transactions match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
