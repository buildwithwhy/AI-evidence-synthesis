import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../api/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { OverrideEntry } from '../types'

interface AnalyticsResult {
  id: string
  title: string
  decision: string
  ai_decision: string
  confidence: number
  source: string
  override_history: OverrideEntry[]
  created_at: string
}

export default function AnalyticsPage() {
  const { projectId } = useParams()
  const [searchParams] = useSearchParams()
  const [level, setLevel] = useState(parseInt(searchParams.get('level') || '1'))
  const [results, setResults] = useState<AnalyticsResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResults()
  }, [projectId, level])

  const loadResults = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('screening_results')
      .select('id,title,decision,ai_decision,confidence,source,override_history,created_at')
      .eq('project_id', projectId)
      .eq('level', level)
    setResults(data || [])
    setLoading(false)
  }

  // Helper: check if a result has been overridden (JSONB array with entries)
  const isOverridden = (r: AnalyticsResult) =>
    Array.isArray(r.override_history) && r.override_history.length > 0

  const total = results.length
  const included = results.filter((r) => r.decision === 'INCLUDE').length
  const excluded = results.filter((r) => r.decision === 'EXCLUDE').length
  const unclear = results.filter((r) => r.decision === 'UNCLEAR').length

  // Override analysis
  const overriddenResults = results.filter(isOverridden)
  const overridden = overriddenResults.length
  const overrideRate = total > 0 ? ((overridden / total) * 100).toFixed(1) : '0'

  // AI vs Human agreement
  const aiAgreed = results.filter((r) => !isOverridden(r) && r.ai_decision === r.decision).length
  const aiOverruled = overridden

  // Override direction breakdown (AI said X, human changed to Y)
  const overrideFlows: Record<string, number> = {}
  overriddenResults.forEach((r) => {
    if (Array.isArray(r.override_history) && r.override_history.length > 0) {
      const first = r.override_history[0]
      const flow = `${first.from} → ${first.to}`
      overrideFlows[flow] = (overrideFlows[flow] || 0) + 1
    }
  })
  const overrideFlowData = Object.entries(overrideFlows).map(([flow, count]) => ({
    flow,
    count,
  }))

  // Confidence distribution
  const confBuckets = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((min) => ({
    range: `${min}-${min + 9}`,
    count: results.filter((r) => r.confidence >= min && r.confidence < min + 10).length,
  }))

  // Source breakdown
  const sourceCounts: Record<string, Record<string, number>> = {}
  results.forEach((r) => {
    const src = r.source.includes('Mined') ? 'Mined' : r.source
    if (!sourceCounts[src]) sourceCounts[src] = { INCLUDE: 0, EXCLUDE: 0, UNCLEAR: 0 }
    sourceCounts[src][r.decision] = (sourceCounts[src][r.decision] || 0) + 1
  })
  const sourceData = Object.entries(sourceCounts).map(([source, counts]) => ({
    source,
    ...counts,
  }))

  // AI decision distribution for overridden studies
  const aiDecisionOfOverridden: Record<string, number> = {}
  overriddenResults.forEach((r) => {
    const ai = r.ai_decision || 'Unknown'
    aiDecisionOfOverridden[ai] = (aiDecisionOfOverridden[ai] || 0) + 1
  })
  const aiDecisionData = Object.entries(aiDecisionOfOverridden).map(([decision, count]) => ({
    decision,
    count,
  }))

  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
    </div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
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
      </div>

      {total === 0 ? (
        <div className="text-center py-20 text-slate-400">
          No data yet for Level {level}.
        </div>
      ) : (
        <>
          {/* Summary metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Studies', value: total, color: 'text-slate-800' },
              { label: 'Included', value: included, color: 'text-green-600' },
              { label: 'Excluded', value: excluded, color: 'text-red-600' },
              { label: 'Unclear (Deferred)', value: unclear, color: 'text-amber-600' },
            ].map((m) => (
              <div key={m.label} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-sm text-slate-500">{m.label}</div>
                <div className={`text-3xl font-bold ${m.color}`}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Override analysis */}
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Override Analysis</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-sm text-slate-500">Total Overrides</div>
              <div className="text-2xl font-bold text-slate-800">{overridden}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-sm text-slate-500">Override Rate</div>
              <div className="text-2xl font-bold text-slate-800">{overrideRate}%</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-sm text-slate-500">AI Decisions Kept</div>
              <div className="text-2xl font-bold text-green-600">{aiAgreed}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-sm text-slate-500">AI Decisions Overruled</div>
              <div className="text-2xl font-bold text-amber-600">{aiOverruled}</div>
            </div>
          </div>

          {/* Override charts */}
          {overridden > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Override Direction (AI → Human)</h3>
                {overrideFlowData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={overrideFlowData} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="flow" type="category" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-slate-400">No override data yet</p>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Original AI Decision (Overridden Studies)</h3>
                {aiDecisionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={aiDecisionData}>
                      <XAxis dataKey="decision" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count">
                        {aiDecisionData.map((entry, idx) => (
                          <Cell
                            key={idx}
                            fill={
                              entry.decision === 'INCLUDE' ? '#16a34a' :
                              entry.decision === 'EXCLUDE' ? '#dc2626' :
                              '#d97706'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-slate-400">No override data yet</p>
                )}
              </div>
            </div>
          )}

          {/* Main charts */}
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Screening Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Decisions by Source</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sourceData}>
                  <XAxis dataKey="source" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="INCLUDE" fill="#16a34a" stackId="a" />
                  <Bar dataKey="EXCLUDE" fill="#dc2626" stackId="a" />
                  <Bar dataKey="UNCLEAR" fill="#d97706" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Confidence Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={confBuckets}>
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6">
                    {confBuckets.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={
                          parseInt(entry.range) >= 80
                            ? '#16a34a'
                            : parseInt(entry.range) >= 50
                            ? '#d97706'
                            : '#dc2626'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
