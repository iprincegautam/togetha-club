'use client'

import { relativeTimeAgo } from '@/lib/partner-portal'

export type NotificationRow = {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  created_at: string
}

type Props = {
  open: boolean
  onClose: () => void
  items: NotificationRow[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
}

export default function NotificationPanel({
  open,
  onClose,
  items,
  onMarkRead,
  onMarkAllRead,
}: Props) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close notifications"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(44,24,16,0.3)',
            zIndex: 1199,
            border: 'none',
          }}
          onClick={onClose}
        />
      )}
      <aside className={`portal-notify-panel${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="portal-notify-head">
          <strong>Notifications</strong>
          <button type="button" className="admin-link-btn" onClick={onMarkAllRead}>
            Mark all read
          </button>
        </div>
        <div className="portal-notify-list">
          {items.length === 0 ? (
            <p className="account-muted" style={{ padding: 16 }}>
              You&apos;re all caught up.
            </p>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={`portal-notify-item${n.read ? '' : ' unread'}`}
                onClick={() => onMarkRead(n.id)}
                onKeyDown={(e) => e.key === 'Enter' && onMarkRead(n.id)}
                role="button"
                tabIndex={0}
              >
                <strong>{n.title}</strong>
                <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>{n.body}</p>
                <span className="account-muted" style={{ fontSize: '0.75rem' }}>
                  {relativeTimeAgo(n.created_at)}
                </span>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  )
}
