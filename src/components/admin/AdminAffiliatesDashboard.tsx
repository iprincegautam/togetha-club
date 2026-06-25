'use client'

import { useCallback, useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils'
import AdminAffiliateTools from '@/components/admin/AdminAffiliateTools'

interface InfluencerStat {
  id: string
  name: string
  email: string | null
  phone: string | null
  status: string
  paidBookings: number
  totalCommissionPaise: number
  payoutUpi: string | null
  payoutBankName: string | null
  payoutAccountHolder: string | null
  payoutAccountNumber: string | null
  payoutIfsc: string | null
}

function payoutSummary(inf: InfluencerStat): string {
  if (inf.payoutUpi) return `UPI: ${inf.payoutUpi}`
  if (inf.payoutAccountNumber) {
    const bank = inf.payoutBankName ? `${inf.payoutBankName} · ` : ''
    return `${bank}${inf.payoutAccountHolder ?? 'Account'} · ${inf.payoutAccountNumber}`
  }
  return '—'
}

interface PromoRow {
  id: string
  code: string
  influencerName: string
  discountType: string
  discountValue: number
  commissionAmount: number
  grantsPriority: boolean
  usesCount: number
  maxUses: number | null
  active: boolean
}

interface RedemptionRow {
  id: string
  applicantName: string
  batchSlug: string
  promoCode: string
  influencerName: string
  discountAmount: number
  commissionAmount: number
  status: string
  paidAt: string
}

function formatDiscount(type: string, value: number) {
  if (type === 'percent') return `${value}% off`
  return `₹${value.toLocaleString('en-IN')} off`
}

interface PromoEditForm {
  discountValue: string
  commissionAmount: string
  maxUses: string
  grantsPriority: boolean
  active: boolean
}

function promoToEditForm(p: PromoRow): PromoEditForm {
  return {
    discountValue: String(p.discountValue),
    commissionAmount: String(p.commissionAmount),
    maxUses: p.maxUses !== null ? String(p.maxUses) : '',
    grantsPriority: p.grantsPriority,
    active: p.active,
  }
}

export default function AdminAffiliatesDashboard() {
  const [influencers, setInfluencers] = useState<InfluencerStat[]>([])
  const [promoCodes, setPromoCodes] = useState<PromoRow[]>([])
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<PromoEditForm | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/affiliates')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setInfluencers(data.influencerStats ?? [])
        setPromoCodes(data.promoCodes ?? [])
        setRedemptions(data.redemptions ?? [])
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const updateRedemption = async (id: string, status: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/admin/redemptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Update failed')
      setActionMsg('Redemption updated')
      load()
    } catch {
      setActionMsg('Could not update redemption status')
    } finally {
      setUpdatingId(null)
    }
  }

  const startEditPromo = (p: PromoRow) => {
    setEditingPromoId(p.id)
    setEditForm(promoToEditForm(p))
    setActionMsg(null)
  }

  const cancelEditPromo = () => {
    setEditingPromoId(null)
    setEditForm(null)
  }

  const savePromo = async (id: string) => {
    if (!editForm) return
    setUpdatingId(id)
    setActionMsg(null)
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discountValue: Number(editForm.discountValue),
          commissionAmount: Number(editForm.commissionAmount),
          maxUses: editForm.maxUses ? Number(editForm.maxUses) : null,
          grantsPriority: editForm.grantsPriority,
          active: editForm.active,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Update failed')
      setActionMsg(`Updated promo code`)
      cancelEditPromo()
      load()
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Could not update promo code')
    } finally {
      setUpdatingId(null)
    }
  }

  const deletePromo = async (p: PromoRow) => {
    if (!confirm(`Delete promo code ${p.code}? This cannot be undone.`)) return
    setUpdatingId(p.id)
    setActionMsg(null)
    try {
      const res = await fetch(`/api/admin/promo-codes/${p.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Delete failed')
      setActionMsg(`Deleted ${p.code}`)
      if (editingPromoId === p.id) cancelEditPromo()
      load()
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Could not delete promo code')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return <p className="admin-loading">Loading affiliate data...</p>
  }

  if (error) {
    return <p className="apply-error">{error}</p>
  }

  const pendingCount = redemptions.filter((r) => r.status === 'pending').length

  return (
    <div className="admin-affiliates">
      <AdminAffiliateTools onCreated={load} />
      {actionMsg && <p className="admin-msg">{actionMsg}</p>}

      <div className="admin-stat-grid">
        <div className="admin-stat">
          <div className="admin-stat-num">{influencers.length}</div>
          <div className="admin-stat-label">Influencers</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-num">{promoCodes.length}</div>
          <div className="admin-stat-label">Promo codes</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-num">{redemptions.length}</div>
          <div className="admin-stat-label">Redemptions</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-num">{pendingCount}</div>
          <div className="admin-stat-label">Pending payout</div>
        </div>
      </div>

      <section className="admin-section">
        <h2 className="admin-section-title">Influencers</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Paid bookings</th>
                <th>Commission owed</th>
                <th>Payout (summary)</th>
              </tr>
            </thead>
            <tbody>
              {influencers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-empty">
                    No influencers yet — create one above.
                  </td>
                </tr>
              ) : (
                influencers.map((inf) => (
                  <tr key={inf.id}>
                    <td>{inf.name}</td>
                    <td>{inf.email ?? '—'}</td>
                    <td>{inf.status}</td>
                    <td>{inf.paidBookings}</td>
                    <td>{formatPrice(inf.totalCommissionPaise / 100)}</td>
                    <td className="admin-payout-cell">{payoutSummary(inf)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">Payout details (for ops)</h2>
        <p className="admin-muted" style={{ marginBottom: 12 }}>
          Full bank/UPI info partners entered in their portal. Use when marking redemptions paid.
        </p>
        <div className="admin-table-wrap">
          <table className="admin-table admin-table-payout">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>UPI</th>
                <th>Account holder</th>
                <th>Bank</th>
                <th>Account number</th>
                <th>IFSC</th>
              </tr>
            </thead>
            <tbody>
              {influencers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-empty">
                    No payout data yet.
                  </td>
                </tr>
              ) : (
                influencers.map((inf) => (
                  <tr key={inf.id}>
                    <td>{inf.name}</td>
                    <td>{inf.phone ?? '—'}</td>
                    <td>{inf.payoutUpi ?? '—'}</td>
                    <td>{inf.payoutAccountHolder ?? '—'}</td>
                    <td>{inf.payoutBankName ?? '—'}</td>
                    <td>
                      {inf.payoutAccountNumber ? (
                        <code className="admin-code">{inf.payoutAccountNumber}</code>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{inf.payoutIfsc ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">Promo codes</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Influencer</th>
                <th>Discount</th>
                <th>Commission</th>
                <th>Uses</th>
                <th>Priority</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-empty">
                    No promo codes yet.
                  </td>
                </tr>
              ) : (
                promoCodes.map((p) =>
                  editingPromoId === p.id && editForm ? (
                    <tr key={p.id}>
                      <td colSpan={8}>
                        <form
                          className="admin-form-grid"
                          style={{ padding: '12px 0' }}
                          onSubmit={(e) => {
                            e.preventDefault()
                            savePromo(p.id)
                          }}
                        >
                          <p className="admin-muted" style={{ gridColumn: '1 / -1', margin: 0 }}>
                            Editing <code className="admin-code">{p.code}</code> · {p.influencerName}
                          </p>
                          <label className="admin-field">
                            <span>Discount (INR)</span>
                            <input
                              className="apply-input"
                              type="number"
                              required
                              value={editForm.discountValue}
                              onChange={(e) =>
                                setEditForm({ ...editForm, discountValue: e.target.value })
                              }
                            />
                          </label>
                          <label className="admin-field">
                            <span>Commission (paise)</span>
                            <input
                              className="apply-input"
                              type="number"
                              required
                              value={editForm.commissionAmount}
                              onChange={(e) =>
                                setEditForm({ ...editForm, commissionAmount: e.target.value })
                              }
                            />
                          </label>
                          <label className="admin-field">
                            <span>Max uses (optional)</span>
                            <input
                              className="apply-input"
                              type="number"
                              min={1}
                              value={editForm.maxUses}
                              onChange={(e) => setEditForm({ ...editForm, maxUses: e.target.value })}
                              placeholder="Unlimited"
                            />
                          </label>
                          <label className="admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <input
                              type="checkbox"
                              checked={editForm.grantsPriority}
                              onChange={(e) =>
                                setEditForm({ ...editForm, grantsPriority: e.target.checked })
                              }
                            />
                            <span>Grants priority</span>
                          </label>
                          <label className="admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <input
                              type="checkbox"
                              checked={editForm.active}
                              onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                            />
                            <span>Active</span>
                          </label>
                          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12 }}>
                            <button
                              type="submit"
                              className="admin-btn"
                              disabled={updatingId === p.id}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="admin-link-btn"
                              disabled={updatingId === p.id}
                              onClick={cancelEditPromo}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={p.id}>
                      <td>
                        <code className="admin-code">{p.code}</code>
                      </td>
                      <td>{p.influencerName}</td>
                      <td>{formatDiscount(p.discountType, p.discountValue)}</td>
                      <td>{formatPrice(p.commissionAmount / 100)}</td>
                      <td>
                        {p.usesCount}
                        {p.maxUses !== null ? ` / ${p.maxUses}` : ''}
                      </td>
                      <td>{p.grantsPriority ? 'Yes' : '—'}</td>
                      <td>{p.active ? 'Yes' : 'No'}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-link-btn"
                          disabled={updatingId === p.id}
                          onClick={() => startEditPromo(p)}
                        >
                          Edit
                        </button>{' '}
                        <button
                          type="button"
                          className="admin-link-btn admin-danger"
                          disabled={updatingId === p.id}
                          onClick={() => deletePromo(p)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">Recent redemptions</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Batch</th>
                <th>Code</th>
                <th>Influencer</th>
                <th>Discount</th>
                <th>Commission</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {redemptions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="admin-empty">
                    No redemptions yet.
                  </td>
                </tr>
              ) : (
                redemptions.map((r) => (
                  <tr key={r.id}>
                    <td>{r.applicantName}</td>
                    <td>{r.batchSlug}</td>
                    <td>
                      <code className="admin-code">{r.promoCode}</code>
                    </td>
                    <td>{r.influencerName}</td>
                    <td>{formatPrice(r.discountAmount / 100)}</td>
                    <td>{formatPrice(r.commissionAmount / 100)}</td>
                    <td>{r.status}</td>
                    <td>
                      {r.paidAt
                        ? new Date(r.paidAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td>
                      {r.status === 'pending' && (
                        <button
                          type="button"
                          className="admin-link-btn"
                          disabled={updatingId === r.id}
                          onClick={() => updateRedemption(r.id, 'approved')}
                        >
                          Approve
                        </button>
                      )}
                      {(r.status === 'pending' || r.status === 'approved') && (
                        <button
                          type="button"
                          className="admin-link-btn"
                          disabled={updatingId === r.id}
                          onClick={() => updateRedemption(r.id, 'paid_out')}
                        >
                          Mark paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
