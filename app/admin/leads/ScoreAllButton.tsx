'use client'

import { useState } from 'react'

export function ScoreAllButton() {
  const [scoring, setScoring] = useState(false)

  async function handleScoreAll() {
    setScoring(true)
    try {
      const res = await fetch('/api/admin/leads?action=score-all')
      const data = await res.json()
      alert(`Scored ${data.scored} leads`)
      window.location.reload()
    } catch {
      alert('Error scoring leads')
    } finally {
      setScoring(false)
    }
  }

  return (
    <button
      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
      onClick={handleScoreAll}
      disabled={scoring}
    >
      {scoring ? 'Scoring...' : '⚡ Score All Leads'}
    </button>
  )
}
