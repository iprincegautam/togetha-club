import { formatPaise } from '@/lib/utils'

type Month = { label: string; amountPaise: number }

export default function PartnerCommissionChart({ months }: { months: Month[] }) {
  if (months.length === 0) {
    return <p className="account-muted">No commission history yet.</p>
  }

  const max = Math.max(...months.map((m) => m.amountPaise), 1)

  return (
    <div className="portal-chart" role="img" aria-label="Monthly commissions">
      {months.map((m) => (
        <div key={m.label} className="portal-chart-bar-wrap">
          <span className="portal-chart-val">{formatPaise(m.amountPaise)}</span>
          <div
            className="portal-chart-bar"
            style={{ height: `${Math.max(8, (m.amountPaise / max) * 100)}px` }}
          />
          <span className="portal-chart-label">{m.label}</span>
        </div>
      ))}
    </div>
  )
}
