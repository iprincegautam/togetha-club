'use client'

import { useState } from 'react'

interface BatchTabsProps {
  batchId: string
  tabs: { id: string; label: string; content: React.ReactNode }[]
  roseAccent?: boolean
}

export default function BatchTabs({ batchId, tabs, roseAccent }: BatchTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '')

  return (
    <div className="product-body">
      <div className="product-tabs" id={`tabs-${batchId}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`product-tab${activeTab === tab.id ? ' active' : ''}${roseAccent ? ' rose-tab' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`${batchId}-${tab.id}`}
          className={`tab-content${activeTab === tab.id ? ' active' : ''}`}
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}
