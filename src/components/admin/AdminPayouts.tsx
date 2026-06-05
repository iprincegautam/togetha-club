'use client'

import { useEffect, useState } from 'react'
import { formatPaise } from '@/lib/utils'

export default function AdminPayouts() {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [msg, setMsg] = useState('')

  const load = () => {
    fetch('/api/admin/payouts').then((r) => r.json()).then(setData)
  }

  useEffect(() => {
    load()
  }, [])

  const process = async () => {
    const res = await fetch('/api/admin/payouts/process', { method: 'POST' })
    const json = await res.json()
    setMsg(res.ok ? `Processed ${json.processed} creators` : (json.error ?? 'Failed'))
    load()
  }

  const preview = (data?.preview as Record<string, unknown>[]) ?? []

  return (
    <div className="account-stack">
      <div className="portal-banner portal-banner--blue">
        Unpaid confirmed: {formatPaise((data?.totalUnpaidPaise as number) ?? 0)} across{' '}
        {(data?.creatorCount as number) ?? 0} creators
        <button type="button" className="apply-submit" style={{ marginTop: 12 }} onClick={process}>
          Process all ready
        </button>
      </div>
      {msg && <p className="account-msg">{msg}</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Creator</th>
              <th>Bank</th>
              <th>Gross</th>
              <th>TDS</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((p) => (
              <tr key={String(p.influencerId)}>
                <td>{p.name as string}</td>
                <td>{p.hasBank ? '✓' : '✗'}</td>
                <td>{formatPaise(p.grossPaise as number)}</td>
                <td>{formatPaise(p.tdsPaise as number)}</td>
                <td>{formatPaise(p.netPaise as number)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
