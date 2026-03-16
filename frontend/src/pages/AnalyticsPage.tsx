import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../api/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { ScreeningResult } from '../types'

export default function AnalyticsPage() {
  const { projectId } = useParams()
  const [searchParams] = useSearchParams()
  const [level, setLevel] = useState(parseInt(searchParams.get('level') || '1'))
  const [results, setResults] = useState<ScreeningResult[]>([])
  const [loading, setLoading] = useState(true)

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
    setResults(data || [])
    setLoading(false)
  }

  const total = results.length
  const included = results.filter((r) => r.decision === 'INCLUDE').length
  const excluded = results.filter((r) => r.decision === 'EXCLUDE').length
  const unclear = results.filter((r) => r.decision === 'UNCLEAR').length
  const overridden = results.filter((r) => r.override_history).length
  const overrideRate = total > 0 ? ((overridden / total) * 100).toFixed(1) : '0'
  const ovToInc = results.filter((r) => r.override_history && r.decision === 'INCLUDE').length
  const ovToExc = results.filter((r) => r.override_history && r.decision === 'EXCLUDE').length

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
              { label: 'Unclear', value: unclear, color: 'text-amber-600' },
            ].map((m) => (
              <div key={m.label} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-sm text-slate-500">{m.label}</div>
                <div className={`text-3xl font-bold ${m.color}`}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Override analysis */}
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Override Analysis</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-sm text-slate-500">Total Overrides</div>
              <div className="text-2xl font-bold text-slate-800">{overridden}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-sm text-slate-500">Override Rate</div>
              <div className="text-2xl font-bold text-slate-800">{overrideRate}%</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-sm text-slate-500">Overridden to INCLUDE</div>
              <div className="text-2xl font-bold text-green-600">{ovToInc}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-sm text-slate-500">Overridden to EXCLUDE</div>
              <div className="text-2xl font-bold text-red-600">{ovToExc}</div>
            </div>
          </div>

          {/* Charts */}
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
