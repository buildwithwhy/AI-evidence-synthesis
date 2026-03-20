import PublicNav from '../components/PublicNav'
import { Link } from 'react-router-dom'
import { CheckCircle, AlertTriangle } from 'lucide-react'

export default function EvaluationPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Evaluation</h1>
        <p className="text-slate-500 mb-10">
          How we test our screening engine, what datasets we use, and what the results mean.
        </p>

        {/* Methodology */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Methodology</h2>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-slate-600">
            <p>
              We evaluate screening accuracy by comparing AI decisions against
              human-labeled ground truth from published systematic reviews. Each study
              in the benchmark has a known correct answer (include or exclude) determined
              by the original review team.
            </p>
            <p>
              Our primary metric is <strong>sensitivity (recall)</strong> — the percentage
              of truly relevant studies that the AI correctly identifies for inclusion.
              In systematic reviews, this is the critical metric: missing a relevant
              study undermines the entire review. The Cochrane standard requires
              sensitivity above 95%.
            </p>
            <p>
              Our secondary metric is <strong>specificity</strong> — the percentage
              of irrelevant studies correctly excluded. This determines how much manual
              screening work the AI saves. Higher specificity means reviewers spend
              less time on studies that don't belong.
            </p>
          </div>
        </section>

        {/* Key Metrics Explained */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Key Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: 'Sensitivity (Recall)',
                target: '> 95%',
                desc: 'Of all studies that SHOULD be included, what percentage did the AI catch? This is the most important metric — missing relevant studies is the worst error.',
                critical: true,
              },
              {
                name: 'Specificity',
                target: '> 50%',
                desc: 'Of all irrelevant studies, what percentage did the AI correctly filter out? This determines work saved for reviewers.',
                critical: false,
              },
              {
                name: 'Precision',
                target: 'Varies',
                desc: 'Of the studies the AI said INCLUDE, what percentage were actually relevant? Low precision means more false positives (extra work but not dangerous).',
                critical: false,
              },
              {
                name: 'Work Saved',
                target: '> 40%',
                desc: 'The percentage of studies reviewers can skip because the AI excluded them. Only meaningful when sensitivity is above threshold.',
                critical: false,
              },
            ].map(({ name, target, desc, critical }) => (
              <div key={name} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-800 text-sm">{name}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    critical
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-slate-50 text-slate-500 border border-slate-200'
                  }`}>
                    Target: {target}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Datasets */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Benchmark Datasets</h2>
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-lg p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-800">SYNERGY Dataset</h3>
                <span className="text-xs bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full">CC0 License</span>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                26 systematic reviews containing 169,288 studies with 2,834 confirmed
                inclusions (1.67% inclusion rate). Covers mental health, pharmacology,
                clinical interventions, and software engineering domains.
              </p>
              <div className="flex gap-6 text-xs text-slate-400">
                <span>26 reviews</span>
                <span>169K studies</span>
                <span>Binary labels (include/exclude)</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-800">Chan et al. Cochrane Dataset</h3>
                <span className="text-xs bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full">CC BY 4.0</span>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                8,608 Cochrane systematic reviews containing 544,157 labeled abstracts
                across 51 health and medical research areas. Three-level labels: included,
                excluded at abstract screening, excluded at full-text screening.
              </p>
              <div className="flex gap-6 text-xs text-slate-400">
                <span>8,608 reviews</span>
                <span>544K studies</span>
                <span>3-level labels with protocols</span>
              </div>
            </div>
          </div>
        </section>

        {/* Evaluation Tiers */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Evaluation Tiers</h2>
          <div className="space-y-3">
            {[
              {
                tier: 'Tier 1: Smoke Test',
                studies: '10 studies',
                desc: 'Hand-picked studies from a single review (5 include, 5 exclude). Run during development to catch regressions.',
              },
              {
                tier: 'Tier 2: Core Evaluation',
                studies: '500 studies',
                desc: 'Sampled from 5 diverse SYNERGY reviews across pharmacology, clinical, and psychology domains. Primary validation dataset.',
              },
              {
                tier: 'Tier 3: Full Benchmark',
                studies: '169K studies',
                desc: 'Complete SYNERGY dataset across all 26 reviews. For publishable metrics and cross-domain robustness testing.',
              },
            ].map(({ tier, studies, desc }) => (
              <div key={tier} className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-slate-800 text-sm">{tier}</h3>
                    <span className="text-xs text-slate-400">{studies}</span>
                  </div>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Results Placeholder */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Results</h2>
          <div className="border border-amber-200 bg-amber-50 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800 text-sm mb-1">Benchmarks in Progress</h3>
                <p className="text-sm text-amber-700">
                  We are currently running systematic evaluations across multiple LLM models
                  including Llama 3.3, Mistral, DeepSeek, GPT-4o, and Claude. Results will
                  be published here with full methodology once complete.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Multi-model comparison (placeholder for future results) */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Models Under Evaluation</h2>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Model</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Provider</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Sensitivity</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Specificity</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">F1</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { model: 'Llama 3.3 70B', provider: 'Venice AI' },
                  { model: 'Mistral 3.1 24B', provider: 'Venice AI' },
                  { model: 'DeepSeek R1', provider: 'Venice AI' },
                  { model: 'GPT-4o', provider: 'OpenAI / Venice AI' },
                  { model: 'Claude Sonnet 4.6', provider: 'Anthropic / Venice AI' },
                  { model: 'Qwen 3.5', provider: 'Venice AI' },
                  { model: 'Gemini 3 Pro', provider: 'Venice AI' },
                ].map(({ model, provider }) => (
                  <tr key={model} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{model}</td>
                    <td className="px-4 py-3 text-slate-500">{provider}</td>
                    <td className="px-4 py-3 text-slate-400">--</td>
                    <td className="px-4 py-3 text-slate-400">--</td>
                    <td className="px-4 py-3 text-slate-400">--</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Results will be updated as benchmarks complete. All evaluations use the
            SYNERGY Tier 2 dataset (500 studies across 5 reviews).
          </p>
        </section>

        {/* Dual-run explanation */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Dual-Run Consensus</h2>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-sm text-slate-600 space-y-3">
            <p>
              Our screening engine runs each study through the AI twice — once
              deterministically and once with slight variation to probe decision
              stability. The consensus logic:
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Both agree + high confidence:</strong> Decision accepted (INCLUDE or EXCLUDE)</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span><strong>Both agree + low confidence:</strong> Flagged as UNCLEAR for human review</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span><strong>Disagreement:</strong> Always flagged as UNCLEAR for human review</span>
              </div>
            </div>
            <p>
              This mirrors the dual-reviewer requirement in Cochrane methodology. The
              reasoning from both runs is preserved in the audit trail so human
              reviewers can see exactly where the AI was uncertain.
            </p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-slate-400">
          <span>AI Evidence Synthesis</span>
          <div className="flex gap-4">
            <Link to="/about" className="hover:text-slate-600">About</Link>
            <Link to="/evaluation" className="hover:text-slate-600">Evaluation</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
