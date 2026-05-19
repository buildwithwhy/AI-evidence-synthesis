import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../api/supabase'
import DecisionBadge from '../components/DecisionBadge'
import PicoScorecard from '../components/PicoScorecard'
import ConfidenceBar from '../components/ConfidenceBar'
import { Download, ChevronDown, AlertTriangle, Clock, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import type { ScreeningResult } from '../types'

const OVERRIDE_REASON_MIN_LENGTH = 10

export default function ResultsPage() {
  const { projectId } = useParams()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [level, setLevel] = useState(parseInt(searchParams.get('level') || '1'))

  const [results, setResults] = useState<ScreeningResult[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Filters
  const [filterDecision, setFilterDecision] = useState('All')
  const [filterSource, setFilterSource] = useState('All')
  const [maxConfidence, setMaxConfidence] = useState(100)

  // Override modal state
  const [overrideTarget, setOverrideTarget] = useState<{ id: string; to: string } | null>(null)
  const [overrideReason, setOverrideReason] = useState('')
  const [overrideSubmitting, setOverrideSubmitting] = useState(false)

  useEffect(() => {
    loadResults()
  }, [projectId, level])

  const loadResults = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('screening_results')
      .select('id,project_id,level,title,abstract,decision,ai_decision,reason,confidence,p_check,i_check,c_check,o_check,s_check,e_check,p_reas,i_reas,c_reas,o_reas,s_reas,e_reas,source,override_history,created_at')
      .eq('project_id', projectId)
      .eq('level', level)
      .order('created_at', { ascending: true })
      .limit(5000)
    setResults(data || [])
    setLoading(false)
  }

  const filteredResults = results.filter((r) => {
    if (filterDecision !== 'All' && r.decision !== filterDecision) return false
    if (filterSource !== 'All' && r.source !== filterSource) return false
    if (r.confidence > maxConfidence) return false
    return true
  })

  const selected = results.find((r) => r.id === selectedId) || null
  const sources = [...new Set(results.map((r) => r.source))]

  const openOverrideModal = (id: string, decision: string) => {
    setOverrideTarget({ id, to: decision })
    setOverrideReason('')
  }

  const closeOverrideModal = () => {
    setOverrideTarget(null)
    setOverrideReason('')
    setOverrideSubmitting(false)
  }

  const submitOverride = async () => {
    if (!overrideTarget) return
    const trimmed = overrideReason.trim()
    if (trimmed.length < OVERRIDE_REASON_MIN_LENGTH) return

    setOverrideSubmitting(true)

    // Fetch current state to preserve history and capture AI context at override time
    const { data: current } = await supabase
      .from('screening_results')
      .select('decision, ai_decision, confidence, override_history')
      .eq('id', overrideTarget.id)
      .single()

    const prevHistory = Array.isArray(current?.override_history) ? current.override_history : []
    const newEntry = {
      from: current?.decision || 'UNKNOWN',
      to: overrideTarget.to,
      by: user?.email || 'unknown',
      at: new Date().toISOString(),
      reason: trimmed,
      ai_decision_at_override: current?.ai_decision,
      ai_confidence_at_override: current?.confidence,
    }

    const { error } = await supabase
      .from('screening_results')
      .update({
        decision: overrideTarget.to,
        override_history: [...prevHistory, newEntry],
      })
      .eq('id', overrideTarget.id)

    if (error) {
      console.error('Override failed:', error)
      setOverrideSubmitting(false)
      return
    }

    closeOverrideModal()
    loadResults()
  }

  const downloadCSV = () => {
    const headers = ['Title', 'Decision', 'AI_Decision', 'Overridden', 'Override_Count', 'Confidence', 'Reason', 'Source', 'P', 'I', 'C', 'O', 'S', 'E', 'Override_Trail', 'Override_Reasons']
    const rows = results.map((r) => {
      const overrides = Array.isArray(r.override_history) ? r.override_history : []
      const trail = overrides
        .map((e) => `${e.from}->${e.to} by ${e.by} at ${e.at}`)
        .join(' | ')
      const reasons = overrides
        .map((e) => (e.reason || e.note || '').replace(/"/g, '""').replace(/\n/g, ' '))
        .filter((r) => r.length > 0)
        .join(' | ')
      return [
        `"${r.title.replace(/"/g, '""')}"`,
        r.decision, r.ai_decision, overrides.length > 0 ? 'Yes' : 'No', overrides.length,
        r.confidence,
        `"${r.reason.replace(/"/g, '""')}"`,
        r.source,
        r.p_check, r.i_check, r.c_check, r.o_check, r.s_check, r.e_check,
        `"${trail}"`,
        `"${reasons}"`,
      ]
    })
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `screening_results_L${level}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
    </div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Audit Records</h1>
          <p className="text-slate-500 text-sm mt-1">{results.length} studies in Level {level}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-slate-200 rounded-md">
            <button
              onClick={() => setLevel(1)}
              className={`px-3 py-1.5 text-sm font-medium ${level === 1 ? 'bg-slate-800 text-white' : 'text-slate-500'} rounded-l-md`}
            >
              Level 1
            </button>
            <button
              onClick={() => setLevel(2)}
              className={`px-3 py-1.5 text-sm font-medium ${level === 2 ? 'bg-slate-800 text-white' : 'text-slate-500'} rounded-r-md`}
            >
              Level 2
            </button>
          </div>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-md text-sm text-slate-600 hover:bg-slate-50"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p>No results yet for Level {level}. Run some screenings first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Filters + list */}
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Decision</label>
                <select
                  value={filterDecision}
                  onChange={(e) => setFilterDecision(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                >
                  <option>All</option>
                  <option>INCLUDE</option>
                  <option>EXCLUDE</option>
                  <option>UNCLEAR</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Source</label>
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                >
                  <option>All</option>
                  {sources.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  Max Confidence: {maxConfidence}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={maxConfidence}
                  onChange={(e) => setMaxConfidence(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Result list */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
              {filteredResults.map((r, idx) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${
                    selectedId === r.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 truncate flex-1">
                      #{idx + 1} {r.title.substring(0, 35)}...
                    </span>
                    <DecisionBadge decision={r.decision} size="sm" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Detail */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
                <h2 className="text-lg font-semibold text-slate-800">{selected.title}</h2>

                {selected.override_history && selected.override_history.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-700">
                        Override History ({selected.override_history.length})
                      </span>
                      {selected.ai_decision && (
                        <span className="text-xs text-amber-600 ml-auto">
                          Original AI: {selected.ai_decision}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {selected.override_history.map((entry, i) => (
                        <div key={i} className="text-xs text-amber-700">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span>
                              {entry.from} → {entry.to} by {entry.by} on {new Date(entry.at).toLocaleString()}
                            </span>
                          </div>
                          {entry.reason && (
                            <div className="ml-5 mt-1 text-amber-800 bg-amber-100/60 border-l-2 border-amber-300 pl-2 py-1 italic">
                              "{entry.reason}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <DecisionBadge decision={selected.decision} size="lg" />

                <PicoScorecard
                  p={selected.p_check}
                  i={selected.i_check}
                  c={selected.c_check}
                  o={selected.o_check}
                  s={selected.s_check}
                  e={selected.e_check}
                />

                <ConfidenceBar confidence={selected.confidence} />

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
                  <p className="text-sm font-medium text-blue-700 mb-1">AI Reasoning</p>
                  <p className="text-sm text-blue-600">{selected.reason}</p>
                </div>

                <details className="group">
                  <summary className="text-sm font-medium text-slate-600 cursor-pointer flex items-center gap-1">
                    <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                    Full Text / Abstract
                  </summary>
                  <div className="mt-2 p-3 bg-slate-50 rounded-md text-sm text-slate-600 max-h-48 overflow-y-auto">
                    {selected.abstract || 'No text stored'}
                  </div>
                </details>

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Manual Override</p>
                  <p className="text-xs text-slate-500 mb-2">
                    Overriding the AI's decision requires a reason. The system records both the AI's
                    original reasoning and your explanation, which helps surface protocol-interpretation
                    patterns over time.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openOverrideModal(selected.id, 'INCLUDE')}
                      disabled={selected.decision === 'INCLUDE'}
                      className="flex-1 py-2 rounded-md text-sm font-medium border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Override: INCLUDE
                    </button>
                    <button
                      onClick={() => openOverrideModal(selected.id, 'EXCLUDE')}
                      disabled={selected.decision === 'EXCLUDE'}
                      className="flex-1 py-2 rounded-md text-sm font-medium border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Override: EXCLUDE
                    </button>
                    <button
                      onClick={() => openOverrideModal(selected.id, 'UNCLEAR')}
                      disabled={selected.decision === 'UNCLEAR'}
                      className="flex-1 py-2 rounded-md text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Override: UNCLEAR
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-slate-400 py-20">
                Select a study from the list to view details
              </div>
            )}
          </div>
        </div>
      )}

      {overrideTarget && selected && selected.id === overrideTarget.id && (
        <OverrideModal
          study={selected}
          targetDecision={overrideTarget.to}
          reason={overrideReason}
          onReasonChange={setOverrideReason}
          submitting={overrideSubmitting}
          onCancel={closeOverrideModal}
          onSubmit={submitOverride}
        />
      )}
    </div>
  )
}

interface OverrideModalProps {
  study: ScreeningResult
  targetDecision: string
  reason: string
  onReasonChange: (value: string) => void
  submitting: boolean
  onCancel: () => void
  onSubmit: () => void
}

function OverrideModal({
  study,
  targetDecision,
  reason,
  onReasonChange,
  submitting,
  onCancel,
  onSubmit,
}: OverrideModalProps) {
  const trimmed = reason.trim()
  const reasonTooShort = trimmed.length < OVERRIDE_REASON_MIN_LENGTH
  const charsRemaining = Math.max(0, OVERRIDE_REASON_MIN_LENGTH - trimmed.length)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Override AI Decision</h3>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
              <p className="text-xs font-medium text-slate-500 mb-1">Current decision</p>
              <DecisionBadge decision={study.decision} size="sm" />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs font-medium text-blue-600 mb-1">Your override</p>
              <DecisionBadge decision={targetDecision} size="sm" />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-blue-700">
                AI Reasoning (please consider before overriding)
              </p>
              <span className="text-xs text-blue-600">
                AI: {study.ai_decision} ({study.confidence}% confident)
              </span>
            </div>
            <p className="text-sm text-blue-700">{study.reason}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">AI's per-criterion checks</p>
            <PicoScorecard
              p={study.p_check}
              i={study.i_check}
              c={study.c_check}
              o={study.o_check}
              s={study.s_check}
              e={study.e_check}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Why are you overriding? <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Be specific about which criterion the AI applied too strictly or too loosely, or what
              convention the protocol omits. This becomes a structured record that can surface
              protocol-AI gaps over time.
            </p>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={4}
              autoFocus
              placeholder="e.g., Protocol formally excludes secondary prevention populations, but HERS trials are conventionally included in HRT reviews regardless."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {reasonTooShort && (
              <p className="text-xs text-amber-600 mt-1">
                Reason must be at least {OVERRIDE_REASON_MIN_LENGTH} characters
                {charsRemaining > 0 && ` (${charsRemaining} more needed)`}.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={reasonTooShort || submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : `Override to ${targetDecision}`}
          </button>
        </div>
      </div>
    </div>
  )
}
