import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../api/supabase'
import { useAuth } from '../contexts/AuthContext'
import DecisionBadge from '../components/DecisionBadge'
import PicoScorecard from '../components/PicoScorecard'
import ConfidenceBar from '../components/ConfidenceBar'
import { Shuffle, Check, AlertCircle, RotateCw, X } from 'lucide-react'
import type { ScreeningResult, SpotCheckEntry } from '../types'

const HIGH_CONFIDENCE_THRESHOLD = 80
const SAMPLE_SIZE_DEFAULT = 20
const OVERRIDE_REASON_MIN_LENGTH = 10

type QueueItem = ScreeningResult

// Fisher-Yates shuffle, seeded by the current timestamp so each draw is fresh.
function sampleRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

export default function SpotCheckPage() {
  const { projectId } = useParams()
  const { user } = useAuth()

  const [level, setLevel] = useState(1)
  const [sampleSize, setSampleSize] = useState(SAMPLE_SIZE_DEFAULT)
  const [confidenceFloor, setConfidenceFloor] = useState(HIGH_CONFIDENCE_THRESHOLD)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [stats, setStats] = useState({ eligible: 0, alreadyAudited: 0 })

  // Inline override state
  const [overrideTarget, setOverrideTarget] = useState<string | null>(null)
  const [overrideReason, setOverrideReason] = useState('')

  const current = queue[currentIdx]
  const done = queue.length > 0 && currentIdx >= queue.length

  const loadQueue = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setCurrentIdx(0)

    // Fetch all confident, decisive results for this project + level
    const { data } = await supabase
      .from('screening_results')
      .select(
        'id,project_id,level,title,abstract,decision,ai_decision,reason,confidence,p_check,i_check,c_check,o_check,s_check,e_check,p_reas,i_reas,c_reas,o_reas,s_reas,e_reas,source,override_history,spot_check_history,created_at'
      )
      .eq('project_id', projectId)
      .eq('level', level)
      .gte('confidence', confidenceFloor)
      .in('ai_decision', ['INCLUDE', 'EXCLUDE'])
      .limit(10000)

    const all = (data || []) as ScreeningResult[]
    const unaudited = all.filter(
      (r) => !Array.isArray(r.spot_check_history) || r.spot_check_history.length === 0,
    )
    setStats({ eligible: all.length, alreadyAudited: all.length - unaudited.length })
    setQueue(sampleRandom(unaudited, sampleSize))
    setLoading(false)
  }, [projectId, level, confidenceFloor, sampleSize])

  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  const appendSpotCheck = async (
    item: ScreeningResult,
    action: 'confirmed' | 'overridden',
  ) => {
    const entry: SpotCheckEntry = {
      by: user?.email || 'unknown',
      at: new Date().toISOString(),
      action,
      ai_decision_at_check: item.ai_decision,
      ai_confidence_at_check: item.confidence,
      current_decision_at_check: item.decision,
    }
    const prev = Array.isArray(item.spot_check_history) ? item.spot_check_history : []
    const { error } = await supabase
      .from('screening_results')
      .update({ spot_check_history: [...prev, entry] })
      .eq('id', item.id)
    if (error) {
      console.error('Spot-check record failed:', error)
      return false
    }
    return true
  }

  const handleConfirm = async () => {
    if (!current) return
    setSubmitting(true)
    const ok = await appendSpotCheck(current, 'confirmed')
    setSubmitting(false)
    if (ok) setCurrentIdx((i) => i + 1)
  }

  const handleSkip = () => {
    if (!current) return
    setCurrentIdx((i) => i + 1)
  }

  const submitOverride = async () => {
    if (!current || !overrideTarget) return
    const trimmed = overrideReason.trim()
    if (trimmed.length < OVERRIDE_REASON_MIN_LENGTH) return

    setSubmitting(true)

    const { data: fresh } = await supabase
      .from('screening_results')
      .select('decision, ai_decision, confidence, override_history, spot_check_history')
      .eq('id', current.id)
      .single()

    const prevOverrides = Array.isArray(fresh?.override_history) ? fresh.override_history : []
    const overrideEntry = {
      from: fresh?.decision || current.decision,
      to: overrideTarget,
      by: user?.email || 'unknown',
      at: new Date().toISOString(),
      reason: trimmed,
      ai_decision_at_override: fresh?.ai_decision,
      ai_confidence_at_override: fresh?.confidence,
      via: 'spot_check',
    }

    const { error: overrideErr } = await supabase
      .from('screening_results')
      .update({
        decision: overrideTarget,
        override_history: [...prevOverrides, overrideEntry],
      })
      .eq('id', current.id)

    if (overrideErr) {
      console.error('Override during spot-check failed:', overrideErr)
      setSubmitting(false)
      return
    }

    await appendSpotCheck(current, 'overridden')

    setOverrideTarget(null)
    setOverrideReason('')
    setSubmitting(false)
    setCurrentIdx((i) => i + 1)
  }

  const progress = queue.length > 0 ? Math.min(currentIdx, queue.length) : 0
  const progressPct = queue.length > 0 ? (progress / queue.length) * 100 : 0

  const overrideOptions = useMemo(() => {
    if (!current) return []
    const all = ['INCLUDE', 'EXCLUDE', 'UNCLEAR']
    return all.filter((d) => d !== current.decision)
  }, [current])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Spot Check</h1>
          <p className="text-slate-500 text-sm mt-1">
            Audit a random sample of high-confidence AI decisions. Catches silent failures the
            deference signal can't surface.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Level</label>
            <div className="flex border border-slate-200 rounded-md">
              <button
                onClick={() => setLevel(1)}
                className={`flex-1 px-3 py-1.5 text-sm font-medium ${
                  level === 1 ? 'bg-slate-800 text-white' : 'text-slate-500'
                } rounded-l-md`}
              >
                Level 1
              </button>
              <button
                onClick={() => setLevel(2)}
                className={`flex-1 px-3 py-1.5 text-sm font-medium ${
                  level === 2 ? 'bg-slate-800 text-white' : 'text-slate-500'
                } rounded-r-md`}
              >
                Level 2
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              Minimum AI confidence
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={confidenceFloor}
              onChange={(e) => setConfidenceFloor(Number(e.target.value) || 0)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Sample size</label>
            <input
              type="number"
              min={1}
              max={200}
              value={sampleSize}
              onChange={(e) => setSampleSize(Number(e.target.value) || 1)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
            />
          </div>
          <button
            onClick={loadQueue}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-3 py-1.5 border border-slate-200 rounded-md text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <Shuffle className="w-4 h-4" />
            {loading ? 'Loading...' : 'Resample'}
          </button>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex gap-6">
          <span>
            Eligible (confidence ≥ {confidenceFloor}, decisive AI): <strong>{stats.eligible}</strong>
          </span>
          <span>
            Already audited at least once: <strong>{stats.alreadyAudited}</strong>
          </span>
          <span>
            In current queue: <strong>{queue.length}</strong>
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
        </div>
      ) : queue.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-slate-400" />
          <p>No unaudited high-confidence decisions found at the current settings.</p>
          <p className="text-sm mt-2">Try lowering the confidence threshold or switching levels.</p>
        </div>
      ) : done ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <Check className="w-10 h-10 mx-auto mb-3 text-green-500" />
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Spot check complete</h2>
          <p className="text-slate-500 mb-4">
            You audited {queue.length} confident decisions. Resample to draw another batch.
          </p>
          <button
            onClick={loadQueue}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md text-sm hover:bg-slate-900"
          >
            <RotateCw className="w-4 h-4" />
            New sample
          </button>
        </div>
      ) : current ? (
        <>
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-slate-500">
                  Item {progress + 1} of {queue.length}
                </p>
                <p className="text-xs text-slate-500">{Math.round(progressPct)}% reviewed</p>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <h2 className="text-lg font-semibold text-slate-800">{current.title}</h2>

            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <span className="text-xs text-slate-500 mr-2">AI decision:</span>
                <DecisionBadge decision={current.ai_decision} size="sm" />
              </div>
              <div>
                <span className="text-xs text-slate-500 mr-2">Current:</span>
                <DecisionBadge decision={current.decision} size="sm" />
              </div>
            </div>

            <ConfidenceBar confidence={current.confidence} />

            <PicoScorecard
              p={current.p_check}
              i={current.i_check}
              c={current.c_check}
              o={current.o_check}
              s={current.s_check}
              e={current.e_check}
            />

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
              <p className="text-sm font-medium text-blue-700 mb-1">AI Reasoning</p>
              <p className="text-sm text-blue-600">{current.reason}</p>
            </div>

            <details className="group">
              <summary className="text-sm font-medium text-slate-600 cursor-pointer">
                Show abstract
              </summary>
              <div className="mt-2 p-3 bg-slate-50 rounded-md text-sm text-slate-600 max-h-64 overflow-y-auto">
                {current.abstract || 'No abstract stored'}
              </div>
            </details>

            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="flex-1 py-2 rounded-md text-sm font-medium border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
                >
                  Confirm AI decision: {current.decision}
                </button>
                <button
                  onClick={handleSkip}
                  disabled={submitting}
                  className="px-4 py-2 rounded-md text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Skip
                </button>
              </div>
              <div className="flex gap-2">
                <p className="text-xs text-slate-500 self-center mr-1">Or override:</p>
                {overrideOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setOverrideTarget(opt)}
                    disabled={submitting}
                    className="flex-1 py-1.5 rounded-md text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {overrideTarget && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
              onClick={() => !submitting && setOverrideTarget(null)}
            >
              <div
                className="bg-white rounded-lg shadow-xl max-w-xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Override during spot check
                  </h3>
                  <button
                    onClick={() => setOverrideTarget(null)}
                    disabled={submitting}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="px-6 py-4 space-y-3">
                  <div className="text-sm text-slate-600">
                    Changing <DecisionBadge decision={current.decision} size="sm" /> →{' '}
                    <DecisionBadge decision={overrideTarget} size="sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Why are you overriding? <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-slate-500 mb-2">
                      Be specific about which criterion the AI applied too strictly or too loosely.
                    </p>
                    <textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      rows={4}
                      autoFocus
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {overrideReason.trim().length < OVERRIDE_REASON_MIN_LENGTH && (
                      <p className="text-xs text-amber-600 mt-1">
                        Reason must be at least {OVERRIDE_REASON_MIN_LENGTH} characters.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-200 bg-slate-50">
                  <button
                    onClick={() => setOverrideTarget(null)}
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitOverride}
                    disabled={
                      overrideReason.trim().length < OVERRIDE_REASON_MIN_LENGTH || submitting
                    }
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : `Override to ${overrideTarget}`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
