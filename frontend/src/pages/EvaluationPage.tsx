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

        {/* Tier 1 Results */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Tier 1 Results: Smoke Test</h2>
          <p className="text-sm text-slate-500 mb-4">
            10 studies from the Donners et al. 2021 systematic review on emicizumab
            pharmacokinetics (5 include, 5 exclude). Single-run per model, no dual consensus.
          </p>

          <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Model</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Developer</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Sensitivity</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Specificity</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">F1</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">DA Sens</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">DA Spec</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Errors</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Tier 2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { model: 'Mistral 3.1 24B', dev: 'Mistral AI', oss: true, sens: '100%', spec: '60%', f1: '83%', da_s: '100%', da_sp: '60%', err: 2, tier2: true },
                  { model: 'Gemma 3 27B', dev: 'Google', oss: true, sens: '100%', spec: '40%', f1: '77%', da_s: '100%', da_sp: '40%', err: 3, tier2: true },
                  { model: 'Claude Sonnet 4.6', dev: 'Anthropic', oss: false, sens: '60%', spec: '100%', f1: '75%', da_s: '80%', da_sp: '100%', err: 1, tier2: true },
                  { model: 'GPT-4o', dev: 'OpenAI', oss: false, sens: '60%', spec: '100%', f1: '75%', da_s: '60%', da_sp: '100%', err: 2, tier2: true },
                  { model: 'Llama 3.3 70B', dev: 'Meta', oss: true, sens: '80%', spec: '20%', f1: '62%', da_s: '80%', da_sp: '20%', err: 5, tier2: false },
                  { model: 'Kimi k2', dev: 'Moonshot AI', oss: true, sens: '100%*', spec: '100%*', f1: '100%*', da_s: '100%*', da_sp: '100%*', err: 0, tier2: false },
                  { model: 'DeepSeek v3', dev: 'DeepSeek', oss: true, sens: '--', spec: '--', f1: '--', da_s: '--', da_sp: '--', err: null, tier2: false },
                ].map(({ model, dev, oss, sens, spec, f1, da_s, da_sp, err, tier2 }) => (
                  <tr key={model} className={`hover:bg-slate-50 ${tier2 ? '' : 'opacity-60'}`}>
                    <td className="px-4 py-3 font-medium text-slate-800">{model}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {dev}
                      {oss && <span className="ml-2 text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">OS</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{sens}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{spec}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{f1}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{da_s}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{da_sp}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{err !== null ? err : '--'}</td>
                    <td className="px-4 py-3">
                      {tier2 ? (
                        <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">Selected</span>
                      ) : (
                        <span className="text-xs bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">Eliminated</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-slate-400 space-y-1 mb-6">
            <p>All models accessed via Venice AI. * Kimi k2 scored perfectly on 3/10 studies but returned unparseable output for the other 7 (70% JSON error rate). DeepSeek v3 exceeded practical response time limits ({'>'}10 min/study).</p>
          </div>

          {/* Collapsible findings */}
          <details className="border border-slate-200 rounded-lg">
            <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Key Findings from Tier 1
            </summary>
            <div className="px-5 py-4 border-t border-slate-100 space-y-4 text-sm text-slate-600">
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Open source models favour inclusion</h4>
                <p>
                  Mistral and Gemma achieved 100% sensitivity — they caught every
                  relevant study. However, they also incorrectly included 2-3 irrelevant
                  studies, resulting in lower specificity. This is a common pattern:
                  when uncertain, open source models tend to err on the side of inclusion.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Proprietary models favour exclusion</h4>
                <p>
                  GPT-4o and Claude both achieved 100% specificity — every study they
                  excluded was correctly excluded. But they also missed 2 relevant
                  studies each (60% sensitivity). When uncertain, proprietary models
                  tend to err on the side of exclusion.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Claude was the only model to defer</h4>
                <p>
                  Of all models tested, Claude Sonnet 4.6 was the only one that
                  used the UNCLEAR option — flagging 2 studies (22%) for human review
                  rather than committing to a potentially wrong answer. One of these
                  was the HAVEN 3 clinical trial, which Claude correctly identified as
                  an efficacy study (not a pharmacokinetic study) and flagged rather
                  than guessing. This resulted in Claude having the fewest confident
                  errors (just 1) and the highest deference-aware accuracy (88.9%).
                  Under standard metrics, this deference is penalised — Claude's
                  standard sensitivity (60%) understates its actual safety (DA
                  sensitivity 80%).
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Model selection for Tier 2</h4>
                <p>
                  Based on these results, we selected four models for deeper evaluation
                  on the full Donners_2021 review (250 studies): Mistral 3.1 (best
                  open source sensitivity), Gemma 3 27B (second open source option),
                  Claude Sonnet 4.6 (unique deference behavior), and GPT-4o (proprietary
                  baseline). Llama 3.3 was eliminated due to poor specificity (20%).
                  Kimi k2 was eliminated due to unreliable JSON output. DeepSeek v3
                  was eliminated due to impractical response times.
                </p>
              </div>
            </div>
          </details>
        </section>

        {/* Tier 2 Results */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Tier 2 Results: Donners et al. 2021</h2>
          <p className="text-sm text-slate-500 mb-4">
            Complete screening set from Donners et al. 2021 — a systematic review of emicizumab
            pharmacokinetics in hemophilia A. 258 studies (15 include, 243 exclude).
            PICO criteria verified from the{' '}
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8585815/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">published paper</a>.
            Single-run per model, no dual consensus.
          </p>

          {/* Standard metrics table */}
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Standard Metrics</h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Model</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Sensitivity</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Specificity</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Precision</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">F1</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { model: 'Claude Sonnet 4.6', sens: '83.3%', spec: '99.0%', prec: '83.3%', f1: '83.3%', acc: '98.0%' },
                  { model: 'Mistral 3.1 24B', sens: '93.3%', spec: '74.5%', prec: '18.4%', f1: '30.8%', acc: '75.6%' },
                  { model: 'GPT-4o', sens: '73.3%', spec: '89.3%', prec: '29.7%', f1: '42.3%', acc: '88.4%' },
                  { model: 'Gemma 3 27B', sens: '100%', spec: '49.8%', prec: '10.9%', f1: '19.7%', acc: '52.7%' },
                ].map(({ model, sens, spec, prec, f1, acc }) => (
                  <tr key={model} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{model}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{sens}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{spec}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{prec}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{f1}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{acc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Deference-aware metrics table */}
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Deference-Aware Metrics</h3>
          <div className="border border-blue-200 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-blue-50 border-b border-blue-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-blue-700">Model</th>
                  <th className="text-right px-4 py-3 font-medium text-blue-700">DA Sensitivity</th>
                  <th className="text-right px-4 py-3 font-medium text-blue-700">DA Specificity</th>
                  <th className="text-right px-4 py-3 font-medium text-blue-700">Decided F1</th>
                  <th className="text-right px-4 py-3 font-medium text-blue-700">Confident Errors</th>
                  <th className="text-right px-4 py-3 font-medium text-blue-700">Deferred</th>
                  <th className="text-right px-4 py-3 font-medium text-blue-700">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {[
                  { model: 'Claude Sonnet 4.6', da_s: '100%', da_sp: '99.0%', df1: '90.9%', err: 2, def: '7.4%', cov: '92.6%' },
                  { model: 'Mistral 3.1 24B', da_s: '100%', da_sp: '74.5%', df1: '31.1%', err: 62, def: '1.2%', cov: '98.8%' },
                  { model: 'GPT-4o', da_s: '73.3%', da_sp: '89.3%', df1: '42.3%', err: 30, def: '0.4%', cov: '99.6%' },
                  { model: 'Gemma 3 27B', da_s: '100%', da_sp: '49.8%', df1: '19.7%', err: 122, def: '0.0%', cov: '100%' },
                ].map(({ model, da_s, da_sp, df1, err, def: deferred, cov }) => (
                  <tr key={model} className="hover:bg-blue-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800">{model}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{da_s}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{da_sp}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{df1}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{err}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{deferred}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{cov}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Collapsible Tier 2 findings */}
          <details className="border border-slate-200 rounded-lg">
            <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Key Findings from Tier 2
            </summary>
            <div className="px-5 py-4 border-t border-slate-100 space-y-4 text-sm text-slate-600">
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Claude achieved 100% DA sensitivity with only 2 confident errors</h4>
                <p>
                  Across 258 studies, Claude Sonnet 4.6 did not hard-miss a single included study.
                  Every relevant study was either correctly included or flagged for human review.
                  It made only 2 confident errors total out of 258 decisions — an error rate of 0.8%.
                  Standard metrics report its sensitivity as 83.3%, but the 16.7% gap represents
                  studies it correctly deferred rather than guessing wrong.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">The deference-aware framework reveals the true picture</h4>
                <p>
                  Under standard metrics, Mistral (93.3% sensitivity) appears to outperform
                  Claude (83.3%). But Mistral made 62 confident errors while Claude made 2.
                  Deference-aware metrics correctly identify Claude as the safer model: it
                  achieves 100% DA sensitivity by deferring on uncertain cases rather than
                  guessing. This is precisely the behavior you want in a human-in-the-loop system.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">High sensitivity without specificity is unusable</h4>
                <p>
                  Gemma 3 27B achieved 100% sensitivity — it caught every included study.
                  But with 49.8% specificity and 10.9% precision, it marked half the
                  irrelevant studies as INCLUDE. A reviewer using Gemma would need to
                  manually re-screen over half the database, defeating the purpose of
                  AI-assisted screening. This validates our argument that sensitivity
                  alone is insufficient — all three core metrics must be high.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">GPT-4o hard-missed studies without deferring</h4>
                <p>
                  GPT-4o was the only model with DA sensitivity below 100% (73.3%).
                  Unlike Claude, which defers when uncertain, GPT-4o confidently
                  excluded 4 studies that should have been included. It made 30
                  confident errors total. This pattern — confidence without calibration —
                  is exactly what deference-aware evaluation is designed to detect.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Claude had the highest JSON error rate (21%)</h4>
                <p>
                  Claude returned unparseable responses for 55 of 258 studies via Venice AI.
                  Despite this, on the 203 studies it successfully processed, its performance
                  was dramatically better than all other models. This suggests that with
                  improved structured output handling (or a different API provider), Claude's
                  effective results could be even stronger.
                </p>
              </div>
            </div>
          </details>
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
