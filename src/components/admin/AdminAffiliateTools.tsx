'use client'

import { useEffect, useState } from 'react'

interface InfluencerOption {
  id: string
  name: string
  email: string | null
}

interface AdminAffiliateToolsProps {
  onCreated?: () => void
}

export default function AdminAffiliateTools({ onCreated }: AdminAffiliateToolsProps) {
  const [influencers, setInfluencers] = useState<InfluencerOption[]>([])
  const [infName, setInfName] = useState('')
  const [infEmail, setInfEmail] = useState('')
  const [infMsg, setInfMsg] = useState<string | null>(null)
  const [infLogin, setInfLogin] = useState<{ temporaryPassword?: string } | null>(null)

  const [influencerId, setInfluencerId] = useState('')
  const [code, setCode] = useState('')
  const [commission, setCommission] = useState('200000')
  const [discount, setDiscount] = useState('2000')
  const [promoMsg, setPromoMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/influencers')
      .then((r) => r.json())
      .then((json) => {
        const list = (json.influencers ?? []) as InfluencerOption[]
        setInfluencers(list)
        setInfluencerId((prev) => prev || list[0]?.id || '')
      })
      .catch(() => {})
  }, [])

  const createInfluencer = async (e: React.FormEvent) => {
    e.preventDefault()
    setInfMsg(null)
    setInfLogin(null)
    const res = await fetch('/api/admin/influencers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: infName, email: infEmail, createLogin: true }),
    })
    const json = await res.json()
    if (!res.ok) {
      setInfMsg(json.error ?? 'Failed')
      return
    }
    setInfMsg(`Created ${json.influencer.name}`)
    setInfLogin(json.login)
    setInfluencerId(json.influencer.id)
    setInfName('')
    setInfEmail('')
    onCreated?.()
  }

  const createPromo = async (e: React.FormEvent) => {
    e.preventDefault()
    setPromoMsg(null)
    const res = await fetch('/api/admin/promo-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        influencerId,
        code: code || undefined,
        discountType: 'fixed_inr',
        discountValue: Number(discount),
        commissionAmount: Number(commission),
        grantsPriority: true,
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      setPromoMsg(json.error ?? 'Failed')
      return
    }
    setPromoMsg(`Created code ${json.promoCode.code}`)
    setCode('')
    onCreated?.()
  }

  return (
    <div className="admin-stack" style={{ marginBottom: 32 }}>
      <form className="admin-panel" onSubmit={createInfluencer}>
        <h2 className="admin-panel-title">Add influencer</h2>
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Name</span>
            <input className="apply-input" required value={infName} onChange={(e) => setInfName(e.target.value)} />
          </label>
          <label className="admin-field">
            <span>Email (for partner login)</span>
            <input className="apply-input" type="email" required value={infEmail} onChange={(e) => setInfEmail(e.target.value)} />
          </label>
        </div>
        {infMsg && <p className="admin-msg">{infMsg}</p>}
        {infLogin?.temporaryPassword && (
          <p className="admin-msg">Temp password: {infLogin.temporaryPassword}</p>
        )}
        <button type="submit" className="admin-btn">Create + send login</button>
      </form>

      <form className="admin-panel" onSubmit={createPromo}>
        <h2 className="admin-panel-title">Create promo code</h2>
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Influencer</span>
            <select
              className="apply-input"
              required
              value={influencerId}
              onChange={(e) => setInfluencerId(e.target.value)}
            >
              {influencers.length === 0 ? (
                <option value="">Add an influencer first</option>
              ) : (
                influencers.map((inf) => (
                  <option key={inf.id} value={inf.id}>
                    {inf.name}
                    {inf.email ? ` (${inf.email})` : ''}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="admin-field">
            <span>Code (optional)</span>
            <input className="apply-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Auto-generate" />
          </label>
          <label className="admin-field">
            <span>Discount (INR)</span>
            <input className="apply-input" type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </label>
          <label className="admin-field">
            <span>Commission (paise)</span>
            <input className="apply-input" type="number" value={commission} onChange={(e) => setCommission(e.target.value)} />
          </label>
        </div>
        {promoMsg && <p className="admin-msg">{promoMsg}</p>}
        <button type="submit" className="admin-btn" disabled={!influencerId}>
          Create promo
        </button>
      </form>
    </div>
  )
}
