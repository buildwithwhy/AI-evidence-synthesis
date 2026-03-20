import PublicNav from '../components/PublicNav'
import { Link } from 'react-router-dom'
import { CheckCircle, AlertTriangle, Info } from 'lucide-react'

export default function EvaluationPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Evaluation</h1>
        <p className="text-slate-500 mb-4">
          How we test our screening engine, what datasets we use, and what the results mean.
        </p>

        {/* Placeholder banner */}
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 mb-10">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              This page describes our evaluation methodology and framework.
              Benchmark results will be published here once evaluations are complete.
            </p>
          </div>
        </div>

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
                name: 'F1 Score',
                target: 'Varies',
                desc: 'The harmonic mean of precision and sensitivity. Balances the trade-off between catching all relevant studies (sensitivity) and not overwhelming reviewers with false positives (precision). Ranges from 0 to 1, where 1 is perfect.',
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

        {/* Deference-Aware Evaluation */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Deference-Aware Evaluation</h2>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-slate-600">
            <p>
              Standard evaluation metrics treat AI uncertainty as an error. If the AI
              says "I'm not sure" about a study, traditional metrics penalise this
              the same as a wrong answer. We believe this is fundamentally flawed
              for any AI system operating with human oversight.
            </p>
            <p>
              In high-stakes domains — evidence synthesis, clinical decision support,
              legal review, safety-critical systems — AI is not replacing human judgment.
              It is augmenting it. When an AI correctly identifies that a case is ambiguous
              and defers to a human expert, it has <strong>behaved correctly</strong>.
              Penalising appropriate uncertainty creates incentives for overconfident AI,
              which is precisely what you do not want when the consequences of a wrong
              answer are severe.
            </p>
            <p>
              We report both frameworks side by side:
            </p>
            <div className="space-y-3 mt-4">
              <div className="bg-white border border-slate-200 rounded-md p-4">
                <h4 className="font-semibold text-slate-700 mb-1">Standard Metrics</h4>
                <p className="text-xs text-slate-500">
                  UNCLEAR counts as wrong. Comparable to existing literature.
                  Useful for apples-to-apples comparison with other screening tools.
                </p>
              </div>
              <div className="bg-white border border-blue-200 rounded-md p-4">
                <h4 className="font-semibold text-blue-700 mb-1">Deference-Aware Metrics</h4>
                <p className="text-xs text-slate-500 mb-2">
                  UNCLEAR counts as correct deference. Reflects actual system safety.
                </p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li><strong>Safe sensitivity:</strong> Only "hard misses" count as failures — cases where the AI confidently said EXCLUDE on a study that should have been included. Deferred studies are not penalised.</li>
                  <li><strong>Decided accuracy:</strong> How accurate the AI is on the subset of studies where it made a confident call.</li>
                  <li><strong>Deference rate:</strong> What percentage of studies the AI flagged for human review rather than deciding autonomously.</li>
                  <li><strong>Effective coverage:</strong> What percentage of screening the AI can handle without human intervention.</li>
                  <li><strong>Hard misses:</strong> The only true failures — confident wrong answers on included studies.</li>
                </ul>
              </div>
            </div>
            <p className="mt-4 text-slate-500 italic">
              This framework applies beyond systematic reviews. Any domain where AI operates
              under human oversight — clinical decision support, legal document review,
              safety-critical engineering, financial audit — benefits from evaluation
              methods that reward appropriate uncertainty rather than penalising it.
              A forthcoming white paper will formalise this as a general evaluation
              framework for human-in-the-loop AI systems.
            </p>
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
                inclusions (1.67% inclusion rate). Covers pharmacology, preclinical research,
                clinical interventions, and other domains.
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
                studies: '1,345 studies',
                desc: 'Complete screening sets from 3 verified reviews with PICO criteria extracted from published papers. Covers human pharmacology, preclinical research, and clinical biosimilars.',
              },
              {
                tier: 'Tier 3: Full Benchmark',
                studies: '169K studies',
                desc: 'Complete SYNERGY dataset across all 26 reviews. For aggregate statistics and cross-domain robustness testing.',
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
                  We are currently running systematic evaluations across multiple LLM models.
                  Results will be published here with both standard and deference-aware
                  metrics once complete.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Multi-model comparison */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Models Under Evaluation</h2>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Model</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Developer</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Sensitivity</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Safe Sensitivity</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">F1</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { model: 'Llama 3.3 70B', developer: 'Meta' },
                  { model: 'Mistral 3.1 24B', developer: 'Mistral AI' },
                  { model: 'DeepSeek R1', developer: 'DeepSeek' },
                  { model: 'GPT-4o', developer: 'OpenAI' },
                  { model: 'Claude Sonnet 4.6', developer: 'Anthropic' },
                  { model: 'Qwen 3.5', developer: 'Alibaba Cloud' },
                  { model: 'Gemini 3 Pro', developer: 'Google' },
                  { model: 'Grok 4.1', developer: 'xAI' },
                ].map(({ model, developer }) => (
                  <tr key={model} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{model}</td>
                    <td className="px-4 py-3 text-slate-500">{developer}</td>
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
            All models accessed via Venice AI. Results will be updated as benchmarks
            complete. Evaluations use the SYNERGY Tier 2 dataset (1,345 studies
            across 3 verified reviews with complete screening sets).
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
