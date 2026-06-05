'use client'

import { useEffect, useState } from 'react'

export default function AdminNotificationsCenter() {
  const [log, setLog] = useState<Record<string, unknown>[]>([])
  const [influencers, setInfluencers] = useState<{ id: string; name: string }[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [mode, setMode] = useState('all')
  const [influencerId, setInfluencerId] = useState('')

  const load = () => {
    fetch('/api/admin/notifications').then((r) => r.json()).then((j) => setLog(j.notifications ?? []))
    fetch('/api/admin/influencers').then((r) => r.json()).then((j) => setInfluencers(j.influencers ?? []))
  }

  useEffect(() => {
    load()
  }, [])

  const send = async () => {
    await fetch('/api/admin/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, recipientMode: mode, influencerId, type: 'announcement' }),
    })
    setTitle('')
    setBody('')
    load()
  }

  return (
    <div className="account-stack">
      <div className="account-panel">
        <h2 className="account-panel-title">Send notification</h2>
        <select className="apply-input" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="all">All active creators</option>
          <option value="specific">Specific creator</option>
          <option value="pending_content">Creators with pending content</option>
        </select>
        {mode === 'specific' && (
          <select className="apply-input" style={{ marginTop: 8 }} value={influencerId} onChange={(e) => setInfluencerId(e.target.value)}>
            <option value="">Select</option>
            {influencers.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        )}
        <input className="apply-input" style={{ marginTop: 8 }} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="apply-input" style={{ marginTop: 8 }} placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
        <div className="portal-banner portal-banner--amber" style={{ marginTop: 12 }}>
          Preview: <strong>{title || 'Title'}</strong> — {body || 'Body'}
        </div>
        <button type="button" className="apply-submit" style={{ marginTop: 12 }} onClick={send}>
          Send
        </button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Sent</th>
              <th>Title</th>
              <th>Body</th>
            </tr>
          </thead>
          <tbody>
            {log.map((n) => (
              <tr key={String(n.id)}>
                <td>{new Date(String(n.created_at)).toLocaleString('en-IN')}</td>
                <td>{String(n.title)}</td>
                <td>{String(n.body).slice(0, 60)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
