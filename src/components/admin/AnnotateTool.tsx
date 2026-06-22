'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  FAILURE_REASON_OPTIONS,
  formatJotformTrainingEntry,
  sidebarStatusColor,
  type DmAnnotation,
  type FailureReason,
} from '@/lib/annotations/types'

type Tab = 'annotate' | 'review' | 'leaderboard'

const WINNING_MAX_CHARS = 280

function categoryLabel(category: string | null) {
  if (!category) return '—'
  return category.replace(/_/g, ' ')
}

function DmBubble({ text, variant }: { text: string; variant: 'user' | 'agent' | 'winning' }) {
  const bg =
    variant === 'user' ? '#efefef' : variant === 'agent' ? '#dbeafe' : '#dcfce7'
  return (
    <div
      style={{
        background: bg,
        borderRadius: 18,
        padding: '12px 16px',
        maxWidth: '90%',
        fontSize: '0.95rem',
        lineHeight: 1.45,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {text || '(empty)'}
    </div>
  )
}

export default function AnnotateTool({ annotatorName }: { annotatorName: string }) {
  const [tab, setTab] = useState<Tab>('annotate')
  const [annotations, setAnnotations] = useState<DmAnnotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sessionSubmitted, setSessionSubmitted] = useState(0)
  const [saving, setSaving] = useState(false)

  const [failureReason, setFailureReason] = useState<FailureReason | ''>('')
  const [toneScore, setToneScore] = useState(3)
  const [conversionScore, setConversionScore] = useState(3)
  const [annotatorNotes, setAnnotatorNotes] = useState('')
  const [isFlagged, setIsFlagged] = useState(false)
  const [winningResponse, setWinningResponse] = useState('')

  const [reviewReason, setReviewReason] = useState<Record<string, string>>({})

  const loadAnnotations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/annotations')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load annotations')
      setAnnotations(json.annotations ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAnnotations()
  }, [loadAnnotations])

  const selected = useMemo(
    () => annotations.find((a) => a.id === selectedId) ?? null,
    [annotations, selectedId]
  )

  const annotateQueue = useMemo(
    () =>
      annotations.filter(
        (a) => a.annotation_status === 'draft' || (a.annotation_status === 'submitted' && a.rejection_reason)
      ),
    [annotations]
  )

  const firstUnannotatedId = useMemo(() => {
    const next = annotateQueue.find(
      (a) =>
        a.annotation_status === 'draft' &&
        !a.is_flagged &&
        (!a.winning_response?.trim() || a.rejection_reason)
    )
    return next?.id ?? annotateQueue[0]?.id ?? annotations[0]?.id ?? null
  }, [annotateQueue, annotations])

  useEffect(() => {
    if (!selectedId && firstUnannotatedId) {
      setSelectedId(firstUnannotatedId)
    }
  }, [selectedId, firstUnannotatedId])

  useEffect(() => {
    if (!selected) return
    setFailureReason(selected.failure_reason ?? '')
    setToneScore(selected.tone_score_losing ?? 3)
    setConversionScore(selected.conversion_score_winning ?? 3)
    setAnnotatorNotes(selected.annotator_notes ?? '')
    setIsFlagged(selected.is_flagged)
    setWinningResponse(selected.winning_response ?? '')
  }, [selected])

  const totalCount = annotations.length
  const submittedCount = annotations.filter(
    (a) => a.annotation_status === 'submitted' || a.annotation_status === 'reviewed'
  ).length
  const sessionProgress = sessionSubmitted

  const winningChars = winningResponse.length
  const winningOverLimit = winningChars > WINNING_MAX_CHARS
  const canEditSelected = selected?.annotation_status === 'draft'

  async function persist(status: 'draft' | 'submitted') {
    if (!selected) return
    if (status === 'submitted' && !isFlagged && !winningResponse.trim()) {
      setError('Write a winning response or flag the entry if you do not know the answer.')
      return
    }
    if (status === 'submitted' && winningOverLimit) {
      setError('Winning response must be 280 characters or fewer.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/annotations/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          failure_reason: failureReason || null,
          winning_response: winningResponse,
          tone_score_losing: toneScore,
          conversion_score_winning: conversionScore,
          annotator_notes: annotatorNotes,
          is_flagged: isFlagged,
          annotator_name: annotatorName,
          annotation_status: status,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Save failed')

      const updated = json.annotation as DmAnnotation
      setAnnotations((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))

      if (status === 'submitted') {
        setSessionSubmitted((n) => n + 1)
        const idx = annotateQueue.findIndex((a) => a.id === selected.id)
        const next = annotateQueue.slice(idx + 1).find((a) => a.annotation_status === 'draft')
        setSelectedId(next?.id ?? annotateQueue.find((a) => a.annotation_status === 'draft')?.id ?? null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function reviewAnnotation(id: string, action: 'approve' | 'reject' | 'send_back') {
    const reason = reviewReason[id]?.trim()
    if ((action === 'reject' || action === 'send_back') && !reason) {
      setError('Enter a reason before rejecting or sending back.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/annotations/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, reason }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Review failed')

      const updated = json.annotation as DmAnnotation
      setAnnotations((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      setReviewReason((prev) => ({ ...prev, [id]: '' }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed')
    } finally {
      setSaving(false)
    }
  }

  function exportSingle(row: DmAnnotation) {
    const text = formatJotformTrainingEntry(row)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${row.message_id}_jotform_training.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const reviewedRows = annotations.filter((a) => a.annotation_status === 'reviewed')
  const judgedRows = reviewedRows.filter((a) => a.improvement_delta != null)

  const avgLosing =
    judgedRows.length > 0
      ? judgedRows.reduce((s, r) => s + (r.judge_score_losing ?? 0), 0) / judgedRows.length
      : 0
  const avgWinning =
    judgedRows.length > 0
      ? judgedRows.reduce((s, r) => s + (r.judge_score_winning ?? 0), 0) / judgedRows.length
      : 0
  const totalGap = avgWinning - avgLosing

  const categoryChart = useMemo(() => {
    const map = new Map<string, { category: string; delta: number; count: number }>()
    for (const row of judgedRows) {
      if (!row.category || row.improvement_delta == null) continue
      const existing = map.get(row.category)
      if (existing) {
        existing.delta += row.improvement_delta
        existing.count += 1
      } else {
        map.set(row.category, { category: row.category, delta: row.improvement_delta, count: 1 })
      }
    }
    return Array.from(map.values())
      .map((item) => ({
        category: categoryLabel(item.category),
        avgDelta: Number((item.delta / item.count).toFixed(1)),
      }))
      .sort((a, b) => b.avgDelta - a.avgDelta)
  }, [judgedRows])

  const maxDelta = categoryChart.reduce((m, c) => Math.max(m, c.avgDelta), 0)
  const minDelta = categoryChart.reduce((m, c) => Math.min(m, c.avgDelta), maxDelta)

  const top10 = [...judgedRows]
    .sort((a, b) => (b.improvement_delta ?? 0) - (a.improvement_delta ?? 0))
    .slice(0, 10)

  const annotatorStats = useMemo(() => {
    const map = new Map<
      string,
      { name: string; submitted: number; conversionSum: number; flagged: number }
    >()
    for (const row of annotations) {
      if (row.annotation_status !== 'submitted' && row.annotation_status !== 'reviewed') continue
      const name = row.annotator_name ?? 'Unknown'
      const entry = map.get(name) ?? { name, submitted: 0, conversionSum: 0, flagged: 0 }
      entry.submitted += 1
      entry.conversionSum += row.conversion_score_winning ?? 0
      if (row.is_flagged) entry.flagged += 1
      map.set(name, entry)
    }
    return Array.from(map.values()).map((e) => ({
      ...e,
      avgConversion: e.submitted ? (e.conversionSum / e.submitted).toFixed(1) : '—',
    }))
  }, [annotations])

  const submittedForReview = annotations.filter((a) => a.annotation_status === 'submitted')

  const sidebarColorMap = {
    grey: '#d1d5db',
    yellow: '#fde047',
    green: '#86efac',
    red: '#fca5a5',
  }

  if (loading) {
    return <p className="admin-muted">Loading annotations…</p>
  }

  return (
    <div style={{ background: '#fff', color: '#111', minHeight: '70vh' }}>
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid #e5e7eb',
          marginBottom: 20,
        }}
      >
        {(['annotate', 'review', 'leaderboard'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: tab === t ? '2px solid #111' : '2px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              fontWeight: tab === t ? 600 : 400,
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <p className="apply-error" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </p>
      )}

      {tab === 'annotate' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.9rem' }}>
                {sessionProgress} of {totalCount} messages annotated this session
              </span>
              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                {submittedCount} total submitted
              </span>
            </div>
            <div
              style={{
                height: 8,
                background: '#e5e7eb',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${totalCount ? (sessionProgress / totalCount) * 100 : 0}%`,
                  background: '#111',
                  transition: 'width 0.2s',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 0, border: '1px solid #e5e7eb', minHeight: 560 }}>
            <aside
              style={{
                width: 220,
                borderRight: '1px solid #e5e7eb',
                overflowY: 'auto',
                maxHeight: 640,
                flexShrink: 0,
              }}
            >
              {annotations.map((row) => {
                const color = sidebarStatusColor(row)
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      border: 'none',
                      borderBottom: '1px solid #f3f4f6',
                      background: selectedId === row.id ? '#f9fafb' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: sidebarColorMap[color],
                        marginRight: 8,
                      }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{row.message_id}</span>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginTop: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.user_message.slice(0, 60)}
                    </div>
                  </button>
                )
              })}
            </aside>

            {selected ? (
              <>
                <div
                  style={{
                    width: '40%',
                    padding: 20,
                    borderRight: '1px solid #e5e7eb',
                    overflowY: 'auto',
                  }}
                >
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 8 }}>
                    {selected.message_id} · {categoryLabel(selected.category)} ·{' '}
                    {selected.urgency ?? '—'} urgency
                  </p>

                  {selected.rejection_reason && (
                    <div
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        padding: 12,
                        marginBottom: 16,
                        fontSize: '0.88rem',
                      }}
                    >
                      <strong>Sent back:</strong> {selected.rejection_reason}
                    </div>
                  )}

                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 6 }}>User DM</p>
                    <DmBubble text={selected.user_message} variant="user" />
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 6 }}>
                      Agent response (losing)
                    </p>
                    <DmBubble
                      text={selected.losing_response?.trim() || 'Not imported yet — use import API or Jotform logs.'}
                      variant="agent"
                    />
                  </div>

                  <label style={{ display: 'block', marginBottom: 16, fontSize: '0.88rem' }}>
                    Why did this fail?
                    <select
                      value={failureReason}
                      onChange={(e) => setFailureReason(e.target.value as FailureReason | '')}
                      disabled={!canEditSelected}
                      style={{
                        display: 'block',
                        width: '100%',
                        marginTop: 6,
                        padding: 8,
                        border: '1px solid #d1d5db',
                        borderRadius: 4,
                      }}
                    >
                      <option value="">Select a reason…</option>
                      {FAILURE_REASON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: 'block', marginBottom: 12, fontSize: '0.88rem' }}>
                    Tone score of losing response ({toneScore})
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={toneScore}
                      onChange={(e) => setToneScore(Number(e.target.value))}
                      disabled={!canEditSelected}
                      style={{ display: 'block', width: '100%', marginTop: 6 }}
                    />
                  </label>

                  <label style={{ display: 'block', marginBottom: 16, fontSize: '0.88rem' }}>
                    Conversion likelihood of winning response ({conversionScore})
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={conversionScore}
                      onChange={(e) => setConversionScore(Number(e.target.value))}
                      disabled={!canEditSelected}
                      style={{ display: 'block', width: '100%', marginTop: 6 }}
                    />
                  </label>

                  <label style={{ display: 'block', marginBottom: 16, fontSize: '0.88rem' }}>
                    Annotator notes (optional)
                    <textarea
                      value={annotatorNotes}
                      onChange={(e) => setAnnotatorNotes(e.target.value)}
                      disabled={!canEditSelected}
                      rows={3}
                      style={{
                        display: 'block',
                        width: '100%',
                        marginTop: 6,
                        padding: 8,
                        border: '1px solid #d1d5db',
                        borderRadius: 4,
                        resize: 'vertical',
                      }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
                    <input
                      type="checkbox"
                      checked={isFlagged}
                      onChange={(e) => setIsFlagged(e.target.checked)}
                      disabled={!canEditSelected}
                    />
                    Flag this entry — I do not know the correct answer
                  </label>

                  {!canEditSelected && (
                    <p style={{ marginTop: 16, fontSize: '0.85rem', color: '#6b7280' }}>
                      This annotation is locked ({selected.annotation_status}).
                    </p>
                  )}
                </div>

                <div style={{ width: '60%', padding: 20, display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    Winning response
                    <textarea
                      value={winningResponse}
                      onChange={(e) => setWinningResponse(e.target.value)}
                      disabled={!canEditSelected}
                      placeholder="Write the winning response here. What should the agent have said?"
                      rows={8}
                      style={{
                        display: 'block',
                        width: '100%',
                        marginTop: 8,
                        padding: 12,
                        border: '1px solid #d1d5db',
                        borderRadius: 4,
                        fontSize: '1rem',
                        resize: 'vertical',
                        flex: 1,
                        minHeight: 180,
                      }}
                    />
                  </label>

                  <p
                    style={{
                      marginTop: 6,
                      fontSize: '0.82rem',
                      color: winningOverLimit ? '#dc2626' : '#6b7280',
                    }}
                  >
                    {winningChars} / {WINNING_MAX_CHARS} characters
                  </p>

                  <div style={{ marginTop: 16, marginBottom: 20 }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 8 }}>Preview</p>
                    <DmBubble text={winningResponse} variant="winning" />
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: 12 }}>
                    <button
                      type="button"
                      className="admin-btn"
                      disabled={!canEditSelected || saving}
                      onClick={() => void persist('draft')}
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      className="admin-btn"
                      disabled={!canEditSelected || saving}
                      onClick={() => void persist('submitted')}
                    >
                      Submit Annotation
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding: 40, color: '#6b7280' }}>Select a message from the sidebar.</div>
            )}
          </div>
        </>
      )}

      {tab === 'review' && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Message ID</th>
                <th>Category</th>
                <th>Urgency</th>
                <th>Annotator</th>
                <th>Tone</th>
                <th>Conversion</th>
                <th>Flagged</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submittedForReview.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ color: '#6b7280' }}>
                    No annotations awaiting review.
                  </td>
                </tr>
              ) : (
                submittedForReview.map((row) => (
                  <tr key={row.id}>
                    <td>{row.message_id}</td>
                    <td>{categoryLabel(row.category)}</td>
                    <td>{row.urgency ?? '—'}</td>
                    <td>{row.annotator_name ?? '—'}</td>
                    <td>{row.tone_score_losing ?? '—'}</td>
                    <td>{row.conversion_score_winning ?? '—'}</td>
                    <td>{row.is_flagged ? 'Yes' : 'No'}</td>
                    <td>
                      {row.submitted_at
                        ? new Date(row.submitted_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
                        <input
                          type="text"
                          placeholder="Reason (reject / send back)"
                          value={reviewReason[row.id] ?? ''}
                          onChange={(e) =>
                            setReviewReason((prev) => ({ ...prev, [row.id]: e.target.value }))
                          }
                          style={{ padding: 6, border: '1px solid #d1d5db', borderRadius: 4 }}
                        />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          <button
                            type="button"
                            className="admin-btn"
                            disabled={saving}
                            onClick={() => void reviewAnnotation(row.id, 'approve')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="admin-btn"
                            disabled={saving}
                            onClick={() => void reviewAnnotation(row.id, 'reject')}
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            className="admin-btn"
                            disabled={saving}
                            onClick={() => void reviewAnnotation(row.id, 'send_back')}
                          >
                            Send back
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'leaderboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <section>
            <h2 className="admin-section-title">Overall health</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 12 }}>
              <div style={{ border: '1px solid #e5e7eb', padding: 16, borderRadius: 4 }}>
                <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Avg agent score (before)</p>
                <p style={{ fontSize: '1.6rem', fontWeight: 600 }}>{avgLosing.toFixed(1)}</p>
              </div>
              <div style={{ border: '1px solid #e5e7eb', padding: 16, borderRadius: 4 }}>
                <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Avg winning response score</p>
                <p style={{ fontSize: '1.6rem', fontWeight: 600 }}>{avgWinning.toFixed(1)}</p>
              </div>
              <div style={{ border: '1px solid #e5e7eb', padding: 16, borderRadius: 4 }}>
                <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Total improvement gap</p>
                <p style={{ fontSize: '1.6rem', fontWeight: 600 }}>{totalGap.toFixed(1)}</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="admin-section-title">Worst performing categories</h2>
            {categoryChart.length === 0 ? (
              <p className="admin-muted">Run the judge script after approving annotations to see category data.</p>
            ) : (
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={categoryChart} margin={{ top: 8, right: 16, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="category" angle={-35} textAnchor="end" interval={0} height={80} tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} label={{ value: 'Avg Δ', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar dataKey="avgDelta" radius={[4, 4, 0, 0]}>
                      {categoryChart.map((entry) => {
                        const t = maxDelta === minDelta ? 0.5 : (entry.avgDelta - minDelta) / (maxDelta - minDelta)
                        const red = Math.round(220 + t * 35)
                        const green = Math.round(180 - t * 120)
                        return <Cell key={entry.category} fill={`rgb(${red}, ${green}, 80)`} />
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="admin-section-title" style={{ marginBottom: 0 }}>
                Top 10 priority training examples
              </h2>
              <a href="/api/admin/export-training-data" className="admin-btn" style={{ textDecoration: 'none' }}>
                Export all (Δ &gt; 3)
              </a>
            </div>
            <div className="admin-table-wrap" style={{ marginTop: 12 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Message</th>
                    <th>Losing</th>
                    <th>Winning</th>
                    <th>Δ</th>
                    <th>Category</th>
                    <th>Export</th>
                  </tr>
                </thead>
                <tbody>
                  {top10.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ color: '#6b7280' }}>
                        No judged annotations yet.
                      </td>
                    </tr>
                  ) : (
                    top10.map((row) => (
                      <tr key={row.id}>
                        <td style={{ maxWidth: 280 }}>{row.user_message.slice(0, 80)}…</td>
                        <td>{row.judge_score_losing?.toFixed(1) ?? '—'}</td>
                        <td>{row.judge_score_winning?.toFixed(1) ?? '—'}</td>
                        <td>{row.improvement_delta?.toFixed(1) ?? '—'}</td>
                        <td>{categoryLabel(row.category)}</td>
                        <td>
                          <button
                            type="button"
                            className="admin-btn"
                            onClick={() => exportSingle(row)}
                          >
                            Export to Jotform
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="admin-section-title">Annotator stats</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Annotator</th>
                    <th>Submitted</th>
                    <th>Avg conversion score</th>
                    <th>Flagged count</th>
                  </tr>
                </thead>
                <tbody>
                  {annotatorStats.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ color: '#6b7280' }}>
                        No submissions yet.
                      </td>
                    </tr>
                  ) : (
                    annotatorStats.map((row) => (
                      <tr key={row.name}>
                        <td>{row.name}</td>
                        <td>{row.submitted}</td>
                        <td>{row.avgConversion}</td>
                        <td>{row.flagged}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
