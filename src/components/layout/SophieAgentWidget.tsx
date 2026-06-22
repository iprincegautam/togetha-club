'use client'

import Script from 'next/script'
import { useState } from 'react'
import { BUSINESS } from '@/config/business'
import './sophie-agent.css'

const AGENT_ID = process.env.NEXT_PUBLIC_JOTFORM_AGENT_ID?.trim()
const AVATAR_URL = 'https://cdn.jotfor.ms/assets/agent-avatars/avatar_icon_904.png'

function ChatIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm0 14H5.17L4 17.17V4h16v12Z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 1c-2.987 0-3.362.019-4.535.067-1.17.054-1.968.237-2.668.51a5.403 5.403 0 0 0-1.95 1.27A5.384 5.384 0 0 0 1.58 4.794c-.272.7-.46 1.501-.513 2.672C1.014 8.64 1 9.014 1 12.002c0 2.987.014 3.362.067 4.535.054 1.171.24 1.97.513 2.669a5.383 5.383 0 0 0 1.266 1.948 5.417 5.417 0 0 0 1.951 1.27c.7.272 1.498.459 2.668.512C8.638 22.99 9.013 23 12 23s3.362-.017 4.535-.064c1.17-.053 1.972-.24 2.671-.512a5.393 5.393 0 0 0 1.948-1.27 5.384 5.384 0 0 0 1.267-1.948c.271-.7.458-1.498.512-2.669.053-1.173.067-1.547.067-4.535 0-2.988-.014-3.362-.067-4.536-.054-1.17-.24-1.972-.512-2.672a5.384 5.384 0 0 0-1.267-1.947 5.392 5.392 0 0 0-1.948-1.27c-.7-.273-1.5-.456-2.671-.51C15.362 1.014 14.987 1 12 1Zm0 1.981c2.937 0 3.284.018 4.444.064 1.072.048 1.657.23 2.045.38.513.2.878.438 1.263.823a3.4 3.4 0 0 1 .822 1.264c.15.387.332.973.38 2.045.054 1.16.065 1.507.065 4.445 0 2.937-.012 3.284-.064 4.444-.05 1.073-.23 1.654-.38 2.042-.2.514-.438.882-.823 1.267-.385.385-.75.623-1.263.822-.388.15-.973.329-2.045.378-1.16.053-1.507.064-4.444.064-2.937 0-3.284-.018-4.444-.064-1.072-.049-1.654-.227-2.041-.378a3.415 3.415 0 0 1-1.267-.822 3.416 3.416 0 0 1-.822-1.267c-.15-.387-.329-.97-.378-2.042-.052-1.16-.064-1.507-.064-4.444 0-2.938.013-3.285.064-4.445.05-1.072.227-1.658.378-2.045.2-.514.437-.879.822-1.264a3.415 3.415 0 0 1 1.267-.822c.387-.15.969-.332 2.041-.38C8.716 2.991 9.063 2.98 12 2.98Zm5.872 1.827a1.321 1.321 0 1 0 .002 2.642 1.321 1.321 0 0 0-.002-2.642ZM12 6.35A5.649 5.649 0 0 0 6.353 12 5.649 5.649 0 1 0 12 6.352Zm0 1.985a3.665 3.665 0 0 1 3.665 3.666 3.665 3.665 0 1 1-7.33 0A3.665 3.665 0 0 1 12 8.336Z" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  )
}

function JotformAgentEmbed() {
  if (!AGENT_ID) return null

  return (
    <Script
      src={`https://cdn.jotfor.ms/agent/embedjs/${AGENT_ID}/embed.js?skipWelcome=1&maximizable=1`}
      strategy="afterInteractive"
    />
  )
}

function SophieChannelLauncher() {
  const [open, setOpen] = useState(false)

  return (
    <div className="sophie-agent">
      <div
        className={`sophie-agent__panel${open ? ' sophie-agent__panel--open' : ''}`}
        role="dialog"
        aria-label={`Chat with ${BUSINESS.agentName}`}
        aria-hidden={!open}
      >
        <div className="sophie-agent__header">
          <div className="sophie-agent__avatar-wrap">
            <img src={AVATAR_URL} alt="" className="sophie-agent__avatar" />
            <div className="sophie-agent__status-dot" aria-hidden>
              <span />
            </div>
          </div>
          <div className="sophie-agent__meta">
            <p className="sophie-agent__name">{BUSINESS.agentName}</p>
            <p className="sophie-agent__status">Online · {BUSINESS.tradingName}</p>
          </div>
          <button type="button" className="sophie-agent__close" aria-label="Close chat" onClick={() => setOpen(false)}>
            ×
          </button>
        </div>
        <div className="sophie-agent__divider" />
        <div className="sophie-agent__message">
          <img src={AVATAR_URL} alt="" className="sophie-agent__message-avatar" />
          <div className="sophie-agent__bubble">
            <p>Hi there! 🌟</p>
            <p>Ask me about batches, pricing, or how booking works — or message us directly.</p>
          </div>
        </div>
        <div className="sophie-agent__actions">
          <a
            href={BUSINESS.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sophie-agent__cta sophie-agent__cta--primary"
          >
            <WhatsAppIcon />
            WhatsApp us
          </a>
          <a
            href={BUSINESS.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sophie-agent__cta sophie-agent__cta--secondary"
          >
            <InstagramIcon />
            Message on Instagram
          </a>
        </div>
      </div>
      <button
        type="button"
        className={`sophie-agent__launcher${open ? ' sophie-agent__launcher--hidden' : ''}`}
        aria-label={`Open chat with ${BUSINESS.agentName}`}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <ChatIcon />
      </button>
    </div>
  )
}

export default function SophieAgentWidget() {
  if (AGENT_ID) {
    return <JotformAgentEmbed />
  }

  return <SophieChannelLauncher />
}
