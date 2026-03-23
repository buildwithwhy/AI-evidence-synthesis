import PublicNav from '../components/PublicNav'
import Footer from '../components/Footer'
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
              In traditional automated screening evaluation, sensitivity is treated as
              the dominant metric — missing a relevant study is the worst error.
              We argue that in a human-in-the-loop system, <strong>all three core metrics
              matter equally</strong>:
            </p>
            <ul className="space-y-3 ml-1">
              <li>
                <strong>Sensitivity</strong> matters because missing a relevant study
                undermines the review.
              </li>
              <li>
                <strong>Specificity</strong> matters because if the AI fails to filter
                out irrelevant studies, it floods the human reviewer with noise. Reviewer
                fatigue from wading through false positives leads to less careful review
                of each study — defeating the purpose of human oversight.
              </li>
              <li>
                <strong>Precision</strong> matters for the same reason: if most of what
                the AI marks as INCLUDE is actually irrelevant, reviewers learn to distrust
                the AI's INCLUDE decisions and either rubber-stamp them (introducing errors)
                or re-screen everything manually (negating the efficiency gain).
              </li>
            </ul>
            <p>
              A tool that catches every relevant study but also marks half the irrelevant
              ones as INCLUDE has not meaningfully helped the reviewer. All three metrics
              must be high for the system to deliver real value.
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
                desc: 'Of all studies that SHOULD be included, what percentage did the AI catch? Missing relevant studies undermines the entire review.',
                critical: true,
              },
              {
                name: 'Specificity',
                target: '> 80%',
                desc: 'Of all irrelevant studies, what percentage did the AI correctly filter out? Low specificity floods reviewers with noise, causing fatigue and less careful assessment.',
                critical: true,
              },
              {
                name: 'Precision',
                target: '> 50%',
                desc: 'Of the studies the AI said INCLUDE, what percentage were actually relevant? Low precision erodes reviewer trust — they either rubber-stamp decisions or re-screen everything.',
                critical: true,
              },
              {
                name: 'F1 Score',
                target: 'Varies',
                desc: 'The harmonic mean of precision and sensitivity. Balances the trade-off between catching all relevant studies and not overwhelming reviewers with false positives. Ranges from 0 to 1, where 1 is perfect.',
                critical: false,
              },
              {
                name: 'Work Saved',
                target: '> 40%',
                desc: 'The percentage of studies reviewers can skip because the AI excluded them. Only meaningful when all three core metrics are above threshold.',
                critical: false,
              },
            ].map(({ name, target, desc, critical }) => (
              <div key={name} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-800 text-sm">{name}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    critical
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
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
                  UNSURE counts as correct. The only failures are confident wrong
                  answers in either direction. The logic is symmetric:
                </p>
                <div className="text-xs text-slate-500 mb-3 bg-slate-50 rounded p-3 font-mono">
                  <div>AI says INCLUDE, truth is INCLUDE → Correct</div>
                  <div>AI says EXCLUDE, truth is EXCLUDE → Correct</div>
                  <div>AI says UNSURE (either truth) → <span className="text-blue-600 font-semibold">Correct (deferred)</span></div>
                  <div>AI says INCLUDE, truth is EXCLUDE → <span className="text-red-600 font-semibold">Incorrect</span></div>
                  <div>AI says EXCLUDE, truth is INCLUDE → <span className="text-red-600 font-semibold">Incorrect</span></div>
                </div>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li><strong>DA Sensitivity:</strong> Of all studies that should be included, how many did the AI either correctly include OR defer to a human? Only confident exclusions of included studies count as failures.</li>
                  <li><strong>DA Specificity:</strong> Of all studies that should be excluded, how many did the AI either correctly exclude OR defer? Only confident inclusions of excluded studies count as failures.</li>
                  <li><strong>Confident errors:</strong> The total count of confident wrong answers in either direction — the only true failures in a HITL system.</li>
                  <li><strong>Deference rate:</strong> What percentage of studies the AI flagged for human review rather than deciding autonomously.</li>
                  <li><strong>Effective coverage:</strong> What percentage of screening the AI can handle without human intervention.</li>
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

        {/* Model Selection Process */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Model Selection Process</h2>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-slate-600">
            <p>
              We evaluate models through a progressive narrowing process rather than
              running all models on the full dataset. This is both cost-effective and
              methodologically sound — it mirrors how practitioners would actually
              select a model for their workflow.
            </p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="text-blue-600 font-bold mt-0.5">1.</span>
                <div>
                  <strong>Tier 1 screening (all candidate models):</strong> Run every
                  available model on the 10-study smoke test. This takes minutes per
                  model and immediately reveals which models can follow the JSON output
                  format, handle the PICO criteria, and produce reasonable confidence
                  scores. Models that error out or show clearly random performance are
                  eliminated.
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-blue-600 font-bold mt-0.5">2.</span>
                <div>
                  <strong>Tier 2 deep evaluation (top models only):</strong> The best
                  performers from Tier 1 — typically 3-5 models — are run on the full
                  Donners_2021 review (250 studies, complete screening set). This produces
                  statistically meaningful metrics and reveals patterns invisible in 10
                  studies: consistency across study types, calibration of confidence
                  scores, and deference behavior.
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-blue-600 font-bold mt-0.5">3.</span>
                <div>
                  <strong>Dual-run consensus (winning model):</strong> The best model
                  from Tier 2 is run through the production dual-run consensus system
                  to measure how consensus screening improves the metrics — particularly
                  the deference rate and confident error count.
                </div>
              </div>
            </div>
            <p>
              We intentionally include both open-source models (Llama, Mistral,
              DeepSeek, Qwen, Gemma) and proprietary models (GPT-4o, Claude, Gemini)
              in the evaluation. For institutions that require data sovereignty or
              on-premise deployment, knowing which open-source models perform competitively
              is critical.
            </p>
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
                  We are currently running Tier 1 evaluations across 9 LLM models.
                  Initial results show meaningful differences in deference behavior
                  between models. Full Tier 2 results will be published here once complete.
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
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Std Sensitivity</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">DA Sensitivity</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">F1</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { model: 'Llama 3.3 70B', developer: 'Meta', oss: true },
                  { model: 'Mistral 3.1 24B', developer: 'Mistral AI', oss: true },
                  { model: 'DeepSeek v3', developer: 'DeepSeek', oss: true },
                  { model: 'Qwen 3 235B', developer: 'Alibaba Cloud', oss: true },
                  { model: 'Gemma 3 27B', developer: 'Google', oss: true },
                  { model: 'Kimi k2', developer: 'Moonshot AI', oss: true },
                  { model: 'GPT-4o', developer: 'OpenAI', oss: false },
                  { model: 'Claude Sonnet 4.6', developer: 'Anthropic', oss: false },
                  { model: 'Gemini 3 Pro', developer: 'Google', oss: false },
                  { model: 'Grok 4.1', developer: 'xAI', oss: false },
                ].map(({ model, developer, oss }) => (
                  <tr key={model} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{model}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {developer}
                      {oss && <span className="ml-2 text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">open source</span>}
                    </td>
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

      <Footer />
    </div>
  )
}
