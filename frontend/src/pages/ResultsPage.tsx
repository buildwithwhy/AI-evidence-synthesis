import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../api/supabase'
import DecisionBadge from '../components/DecisionBadge'
import PicoScorecard from '../components/PicoScorecard'
import ConfidenceBar from '../components/ConfidenceBar'
import { Download, ChevronDown, AlertTriangle, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import type { ScreeningResult } from '../types'

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

  useEffect(() => {
    loadResults()
  }, [projectId, level])

  const loadResults = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('screening_results')
      .select('*')
      .eq('project_id', projectId)
      .eq('level', level)
      .order('created_at', { ascending: true })
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

  const handleOverride = async (id: string, decision: string) => {
    // Fetch current to preserve history
    const { data: current } = await supabase
      .from('screening_results')
      .select('decision, override_history')
      .eq('id', id)
      .single()

    const prevHistory = Array.isArray(current?.override_history) ? current.override_history : []
    const newEntry = {
      from: current?.decision || 'UNKNOWN',
      to: decision,
      by: user?.email || 'unknown',
      at: new Date().toISOString(),
    }

    await supabase
      .from('screening_results')
      .update({
        decision,
        override_history: [...prevHistory, newEntry],
      })
      .eq('id', id)
    loadResults()
  }

  const downloadCSV = () => {
    const headers = ['Title', 'Decision', 'AI_Decision', 'Overridden', 'Override_Count', 'Confidence', 'Reason', 'Source', 'P', 'I', 'C', 'O', 'S', 'E', 'Override_Trail']
    const rows = results.map((r) => {
      const overrides = Array.isArray(r.override_history) ? r.override_history : []
      const trail = overrides.map(e => `${e.from}->${e.to} by ${e.by} at ${e.at}`).join(' | ')
      return [
        `"${r.title.replace(/"/g, '""')}"`,
        r.decision, r.ai_decision, overrides.length > 0 ? 'Yes' : 'No', overrides.length,
        r.confidence,
        `"${r.reason.replace(/"/g, '""')}"`,
        r.source,
        r.p_check, r.i_check, r.c_check, r.o_check, r.s_check, r.e_check,
        `"${trail}"`,
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
                    <div className="space-y-1">
                      {selected.override_history.map((entry, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-amber-700">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span>
                            {entry.from} → {entry.to} by {entry.by} on {new Date(entry.at).toLocaleString()}
                          </span>
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOverride(selected.id, 'INCLUDE')}
                      className="flex-1 py-2 rounded-md text-sm font-medium border border-green-200 text-green-700 hover:bg-green-50"
                    >
                      Override: INCLUDE
                    </button>
                    <button
                      onClick={() => handleOverride(selected.id, 'EXCLUDE')}
                      className="flex-1 py-2 rounded-md text-sm font-medium border border-red-200 text-red-700 hover:bg-red-50"
                    >
                      Override: EXCLUDE
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
    </div>
  )
}
