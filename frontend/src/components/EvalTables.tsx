import type { ModelResult, ConsensusResult, DualRunResult } from '../data/benchmarkResults'

const ERROR_THRESHOLD = 40 // Default red threshold for errors

// ============================================================
// Framework 1: Forced Binary Table
// ============================================================

export function ForcedBinaryTable({ data, errorThreshold = ERROR_THRESHOLD, showTier2 = false }: {
  data: ModelResult[]
  errorThreshold?: number
  showTier2?: boolean
}) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-3 py-2.5 font-medium text-slate-600">Model</th>
            <th className="text-right px-3 py-2.5 font-medium text-slate-600">Recall</th>
            <th className="text-right px-3 py-2.5 font-medium text-slate-600">Specificity</th>
            <th className="text-right px-3 py-2.5 font-medium text-slate-600">Precision</th>
            <th className="text-right px-3 py-2.5 font-medium text-slate-600">F1</th>
            <th className="text-right px-3 py-2.5 font-medium text-slate-600">Errors</th>
            {showTier2 && <th className="text-left px-3 py-2.5 font-medium text-slate-600">Tier 2</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((d) => (
            <tr key={d.model} className={`${d.green ? 'bg-green-50/50' : ''} ${d.tier2 === false ? 'opacity-50' : ''} hover:bg-slate-50`}>
              <td className="px-3 py-2.5 font-medium text-slate-800">
                {d.model}
                {d.developer && <span className="ml-2 text-xs text-slate-400">{d.developer}</span>}
                {d.oss && <span className="ml-1 text-xs bg-green-50 text-green-600 px-1 rounded">OS</span>}
              </td>
              <td className="px-3 py-2.5 text-right">{d.fb_recall}</td>
              <td className="px-3 py-2.5 text-right">{d.fb_spec}</td>
              <td className="px-3 py-2.5 text-right">{d.fb_prec}</td>
              <td className="px-3 py-2.5 text-right font-medium">{d.fb_f1}</td>
              <td className={`px-3 py-2.5 text-right ${d.fb_errors >= errorThreshold ? 'text-red-600 font-medium' : ''}`}>{d.fb_errors}</td>
              {showTier2 && (
                <td className="px-3 py-2.5">
                  {d.tier2 ? <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">Yes</span> : <span className="text-xs text-slate-300">No</span>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================
// Framework 2: Partial Eval Table
// ============================================================

export function PartialEvalTable({ data }: { data: ModelResult[] }) {
  return (
    <div className="border border-amber-200 rounded-lg overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-amber-50 border-b border-amber-200">
          <tr>
            <th className="text-left px-3 py-2.5 font-medium text-amber-700">Model</th>
            <th className="text-right px-3 py-2.5 font-medium text-amber-700">Recall</th>
            <th className="text-right px-3 py-2.5 font-medium text-amber-700">Specificity</th>
            <th className="text-right px-3 py-2.5 font-medium text-amber-700">Precision</th>
            <th className="text-right px-3 py-2.5 font-medium text-amber-700">F1</th>
            <th className="text-right px-3 py-2.5 font-medium text-amber-700">Coverage</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-amber-100">
          {data.map((d) => (
            <tr key={d.model} className={`${d.green ? 'bg-green-50/50' : ''} hover:bg-amber-50/30`}>
              <td className="px-3 py-2.5 font-medium text-slate-800">{d.model}</td>
              <td className="px-3 py-2.5 text-right">{d.f2_recall}</td>
              <td className="px-3 py-2.5 text-right">{d.f2_spec}</td>
              <td className="px-3 py-2.5 text-right">{d.f2_prec}</td>
              <td className="px-3 py-2.5 text-right font-medium">{d.f2_f1}</td>
              <td className="px-3 py-2.5 text-right">{d.f2_coverage}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================
// Framework 3: Deference-Aware Table
// ============================================================

export function DeferenceAwareTable({ data, errorThreshold = ERROR_THRESHOLD, showTier2 = false }: {
  data: ModelResult[]
  errorThreshold?: number
  showTier2?: boolean
}) {
  return (
    <div className="border border-blue-200 rounded-lg overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-blue-50 border-b border-blue-200">
          <tr>
            <th className="text-left px-3 py-2.5 font-medium text-blue-700">Model</th>
            <th className="text-right px-3 py-2.5 font-medium text-blue-700">DA Sens</th>
            <th className="text-right px-3 py-2.5 font-medium text-blue-700">DA Spec</th>
            {data.some(d => d.da_prec) && <th className="text-right px-3 py-2.5 font-medium text-blue-700">DA Prec</th>}
            <th className="text-right px-3 py-2.5 font-medium text-blue-700">DA F1</th>
            <th className="text-right px-3 py-2.5 font-medium text-blue-700">Errors</th>
            <th className="text-right px-3 py-2.5 font-medium text-blue-700">Deferred</th>
            <th className="text-right px-3 py-2.5 font-medium text-blue-700">Coverage</th>
            {showTier2 && <th className="text-left px-3 py-2.5 font-medium text-blue-700">Tier 2</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-blue-100">
          {data.map((d) => (
            <tr key={d.model} className={`${d.green ? 'bg-green-50/50' : ''} ${d.tier2 === false ? 'opacity-50' : ''} hover:bg-blue-50/30`}>
              <td className="px-3 py-2.5 font-medium text-slate-800">{d.model}</td>
              <td className="px-3 py-2.5 text-right">{d.da_sens}</td>
              <td className="px-3 py-2.5 text-right">{d.da_spec}</td>
              {data.some(dd => dd.da_prec) && <td className="px-3 py-2.5 text-right">{d.da_prec}</td>}
              <td className="px-3 py-2.5 text-right font-medium">{d.da_f1}</td>
              <td className={`px-3 py-2.5 text-right ${d.da_errors >= errorThreshold ? 'text-red-600 font-medium' : ''}`}>{d.da_errors}</td>
              <td className="px-3 py-2.5 text-right">{d.da_deferred}</td>
              <td className="px-3 py-2.5 text-right">{d.da_coverage}</td>
              {showTier2 && (
                <td className="px-3 py-2.5">
                  {d.tier2 ? <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">Yes</span> : <span className="text-xs text-slate-300">No</span>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================
// Tier 3a: Dual-Run Comparison Table
// ============================================================

export function DualRunTable({ data }: { data: DualRunResult[] }) {
  return (
    <div className="border border-blue-200 rounded-lg overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-blue-50 border-b border-blue-200">
          <tr>
            <th className="text-left px-3 py-2.5 font-medium text-blue-700" rowSpan={2}>Model</th>
            <th className="text-center px-3 py-1.5 font-medium text-slate-500 border-b border-slate-200" colSpan={3}>Single-Run DA</th>
            <th className="text-center px-3 py-1.5 font-medium text-blue-700 border-b border-blue-200" colSpan={3}>Dual-Run DA</th>
            <th className="text-center px-3 py-1.5 font-medium text-slate-600 border-b border-slate-200" colSpan={2}>Detail</th>
          </tr>
          <tr>
            <th className="text-right px-3 py-1 text-xs text-slate-400">Sens</th>
            <th className="text-right px-3 py-1 text-xs text-slate-400">Err</th>
            <th className="text-right px-3 py-1 text-xs text-slate-400">Def%</th>
            <th className="text-right px-3 py-1 text-xs text-blue-500">Sens</th>
            <th className="text-right px-3 py-1 text-xs text-blue-500">Err</th>
            <th className="text-right px-3 py-1 text-xs text-blue-500">Def%</th>
            <th className="text-right px-3 py-1 text-xs text-slate-400">H.Miss</th>
            <th className="text-right px-3 py-1 text-xs text-slate-400">Cov</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-blue-100">
          {data.map((d) => (
            <tr key={d.model} className={`${d.green ? 'bg-green-50/50' : ''} hover:bg-blue-50/30`}>
              <td className="px-3 py-2.5 font-medium text-slate-800">{d.model}</td>
              <td className="px-3 py-2.5 text-right text-slate-500">{d.s1_sens}</td>
              <td className="px-3 py-2.5 text-right text-slate-500">{d.s1_errors}</td>
              <td className="px-3 py-2.5 text-right text-slate-500">{d.s1_def}</td>
              <td className="px-3 py-2.5 text-right text-blue-700 font-medium">{d.s2_sens}</td>
              <td className="px-3 py-2.5 text-right text-blue-700 font-medium">{d.s2_errors}</td>
              <td className="px-3 py-2.5 text-right text-blue-700">{d.s2_def}</td>
              <td className={`px-3 py-2.5 text-right ${d.hard_miss > 0 ? 'text-red-600' : 'text-green-600 font-medium'}`}>{d.hard_miss}</td>
              <td className="px-3 py-2.5 text-right">{d.coverage}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================
// Tier 3b: Mixed-Model Consensus Table
// ============================================================

export function MixedConsensusTable({ data, reference }: { data: ConsensusResult[], reference?: ConsensusResult }) {
  return (
    <div className="border border-blue-200 rounded-lg overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-blue-50 border-b border-blue-200">
          <tr>
            <th className="text-left px-3 py-2.5 font-medium text-blue-700">Model Pair</th>
            <th className="text-right px-3 py-2.5 font-medium text-blue-700">DA Sens</th>
            <th className="text-right px-3 py-2.5 font-medium text-blue-700">DA Spec</th>
            <th className="text-right px-3 py-2.5 font-medium text-blue-700">DA F1</th>
            <th className="text-right px-3 py-2.5 font-medium text-blue-700">Errors</th>
            <th className="text-right px-3 py-2.5 font-medium text-blue-700">Deferred</th>
            <th className="text-right px-3 py-2.5 font-medium text-blue-700">Coverage</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-blue-100">
          {data.map((d) => (
            <tr key={d.pair} className="hover:bg-blue-50/30">
              <td className="px-3 py-2.5 font-medium text-slate-800">{d.pair}</td>
              <td className="px-3 py-2.5 text-right">{d.da_sens}</td>
              <td className="px-3 py-2.5 text-right">{d.da_spec}</td>
              <td className="px-3 py-2.5 text-right font-medium">{d.da_f1}</td>
              <td className="px-3 py-2.5 text-right">{d.errors}</td>
              <td className="px-3 py-2.5 text-right">{d.deferred}</td>
              <td className="px-3 py-2.5 text-right">{d.coverage}</td>
            </tr>
          ))}
          {reference && (
            <tr className="bg-slate-50 border-t-2 border-slate-300">
              <td className="px-3 py-2.5 font-medium text-slate-400 italic">{reference.pair}</td>
              <td className="px-3 py-2.5 text-right text-slate-400">{reference.da_sens}</td>
              <td className="px-3 py-2.5 text-right text-slate-400">{reference.da_spec}</td>
              <td className="px-3 py-2.5 text-right text-slate-400">{reference.da_f1}</td>
              <td className="px-3 py-2.5 text-right text-slate-400">{reference.errors}</td>
              <td className="px-3 py-2.5 text-right text-slate-400">{reference.deferred}</td>
              <td className="px-3 py-2.5 text-right text-slate-400">{reference.coverage}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
