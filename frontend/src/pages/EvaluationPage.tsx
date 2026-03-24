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

        {/* Evaluation Frameworks */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Evaluation Frameworks</h2>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-slate-600">
            <p>
              When AI can express uncertainty, how should that uncertainty be evaluated?
              We identify three approaches — one traditional, one mainstream but flawed,
              and one that we propose as a better alternative for human-in-the-loop systems.
            </p>

            <div className="space-y-3 mt-4">
              <div className="bg-white border border-slate-200 rounded-md p-4">
                <h4 className="font-semibold text-slate-700 mb-2">Framework 1: Forced Binary Classification</h4>
                <p className="text-xs text-slate-500">
                  The AI produces only INCLUDE or EXCLUDE, evaluated on standard sensitivity,
                  specificity, and F1. This is the appropriate baseline for fully automated
                  systems. It does not fragment the evaluation — it simply excludes the
                  possibility of uncertainty entirely. The limitation is the assumption that
                  every case must receive a confident decision regardless of how certain the
                  AI actually is.
                </p>
              </div>

              <div className="bg-white border border-amber-200 rounded-md p-4">
                <h4 className="font-semibold text-amber-700 mb-2">
                  Framework 2: Three-Class with Partial Evaluation
                  <span className="ml-2 text-xs font-normal text-amber-500">(mainstream but flawed)</span>
                </h4>
                <p className="text-xs text-slate-500 mb-2">
                  The AI can output UNSURE, but existing approaches handle it in ways that
                  fragment the evaluation:
                </p>
                <ul className="text-xs text-slate-500 space-y-2">
                  <li>
                    <strong>Coverage/risk evaluation</strong> (the mainstream in selective prediction):
                    abstentions are excluded from the denominator and the system is scored only
                    on cases it chose to answer confidently. This hides deferred workload — a
                    system deferring 80% of inputs and getting 99% accuracy on the rest scores
                    well, but the 80% still need to be resolved by someone.
                  </li>
                  <li>
                    <strong>Siloed abstention evaluation</strong> (as in AbstentionBench):
                    abstention capability and task accuracy are measured by separate judges
                    and reported as two disconnected scores.
                  </li>
                </ul>
                <p className="text-xs text-slate-500 mt-2">
                  Both variants share the same core failure: <strong>they evaluate the AI's
                  slice in isolation and tell you nothing about how well the full human-AI
                  system performs.</strong>
                </p>
              </div>

              <div className="bg-white border border-blue-200 rounded-md p-4">
                <h4 className="font-semibold text-blue-700 mb-2">Framework 3: Deference-Aware Evaluation</h4>
                <p className="text-xs text-slate-500 mb-2">
                  UNSURE is scored within the primary task metrics as correct, producing a
                  single unified quality signal that covers confident decisions and appropriate
                  deferrals together. The only failures are confident wrong answers:
                </p>
                <div className="text-xs text-slate-500 mb-3 bg-slate-50 rounded p-3 font-mono">
                  <div>AI says INCLUDE, truth is INCLUDE → Correct</div>
                  <div>AI says EXCLUDE, truth is EXCLUDE → Correct</div>
                  <div>AI says UNSURE (either truth) → <span className="text-blue-600 font-semibold">Correct (deferred)</span></div>
                  <div>AI says INCLUDE, truth is EXCLUDE → <span className="text-red-600 font-semibold">Incorrect</span></div>
                  <div>AI says EXCLUDE, truth is INCLUDE → <span className="text-red-600 font-semibold">Incorrect</span></div>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  Deferred workload is made visible through explicitly reported deference
                  rate and effective coverage, rather than hidden in the denominator.
                </p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li><strong>DA Sensitivity:</strong> Of all studies that should be included, how many did the AI either correctly include OR defer? Only confident exclusions of included studies count as failures.</li>
                  <li><strong>DA Specificity:</strong> Of all studies that should be excluded, how many did the AI either correctly exclude OR defer? Only confident inclusions of excluded studies count as failures.</li>
                  <li><strong>DA F1:</strong> Harmonic mean of DA sensitivity and decided precision. Balances safety (catching included studies or deferring) with quality (when you say INCLUDE, being right).</li>
                  <li><strong>Confident errors:</strong> The total count of confident wrong answers — the only true failures in a HITL system.</li>
                  <li><strong>Deference rate:</strong> What percentage of studies the AI flagged for human review — making workload visible.</li>
                  <li><strong>Effective coverage:</strong> What percentage of screening the AI handles autonomously.</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 p-3 bg-white border border-slate-200 rounded-md">
              <h4 className="font-semibold text-slate-700 text-xs mb-1">On the confidence threshold</h4>
              <p className="text-xs text-slate-500">
                The threshold that triggers UNSURE (default 85%) is a tunable parameter,
                not a fixed standard. Lower thresholds mean more autonomous decisions and
                higher risk. Higher thresholds mean more deference, lower risk, and more
                human workload. The right threshold depends on the domain, the stakes of
                the decision, and the available human oversight capacity. Notably, some
                models (such as Claude) also output UNSURE on their own initiative regardless
                of the threshold, when they judge a case to be genuinely ambiguous.
              </p>
            </div>

            <p className="mt-4 text-slate-500 italic">
              We report Framework 1 and Framework 3 side by side in our results.
              The gap between them shows exactly how much safety is gained by allowing
              deference — and the deference rate and coverage metrics make the workload
              trade-off explicit rather than hiding it. This applies to any domain where
              AI operates under human oversight — not just systematic reviews. A forthcoming
              white paper will formalise this as a general evaluation framework for
              human-in-the-loop AI systems.
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
                tier: 'Tier 3a: Full Benchmark',
                studies: '169K studies',
                desc: 'Complete SYNERGY dataset across all 26 reviews. Single-model evaluation for aggregate statistics and cross-domain robustness testing.',
              },
              {
                tier: 'Tier 3b: Mixed-Model Consensus',
                studies: 'Tier 2 dataset',
                desc: 'Instead of running the same model twice (homogeneous consensus), pair two different models — one optimised for sensitivity, one for specificity. Agreement = confident decision. Disagreement = defer to human. This exploits complementary strengths: the high-sensitivity model catches what the high-specificity model misses, and vice versa. Open source model pairs could match or exceed single proprietary model performance at a fraction of the cost.',
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
                <span className="text-blue-600 font-bold mt-0.5">3a.</span>
                <div>
                  <strong>Same-model consensus (winning model):</strong> The best model
                  from Tier 2 is run through the production dual-run consensus system
                  (same model, two passes) to measure how consensus screening improves
                  the metrics — particularly the deference rate and confident error count.
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-blue-600 font-bold mt-0.5">3b.</span>
                <div>
                  <strong>Mixed-model consensus (model pairs):</strong> Pair two different
                  models with complementary strengths — e.g., a high-sensitivity open source
                  model with a high-specificity one. If both agree, accept the decision.
                  If they disagree, defer to human review. This tests whether cheaper
                  open source model pairs can match the safety profile of a single expensive
                  proprietary model through complementary expertise.
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
            All models accessed via OpenRouter for consistent infrastructure.
          </p>

          <div className="border border-slate-200 rounded-lg overflow-hidden mb-4 overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-3 py-3 font-medium text-slate-600" rowSpan={2}>Model</th>
                  <th className="text-left px-3 py-3 font-medium text-slate-600" rowSpan={2}>Developer</th>
                  <th className="text-center px-3 py-2 font-medium text-slate-500 bg-slate-100 border-b border-slate-200" colSpan={3}>Forced Binary (F1)</th>
                  <th className="text-center px-3 py-2 font-medium text-blue-600 bg-blue-50 border-b border-blue-100" colSpan={3}>Deference-Aware (F3)</th>
                  <th className="text-right px-3 py-3 font-medium text-slate-600" rowSpan={2}>Errors</th>
                  <th className="text-right px-3 py-3 font-medium text-slate-600" rowSpan={2}>Deferred</th>
                  <th className="text-left px-3 py-3 font-medium text-slate-600" rowSpan={2}>Tier 2</th>
                </tr>
                <tr>
                  <th className="text-right px-3 py-1 text-xs text-slate-400 bg-slate-100">Sens</th>
                  <th className="text-right px-3 py-1 text-xs text-slate-400 bg-slate-100">Spec</th>
                  <th className="text-right px-3 py-1 text-xs text-slate-400 bg-slate-100">F1</th>
                  <th className="text-right px-3 py-1 text-xs text-blue-400 bg-blue-50">Sens</th>
                  <th className="text-right px-3 py-1 text-xs text-blue-400 bg-blue-50">Spec</th>
                  <th className="text-right px-3 py-1 text-xs text-blue-400 bg-blue-50">F1</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { model: 'Claude Sonnet 4.6', dev: 'Anthropic', oss: false, fb_s: '60%', fb_sp: '100%', fb_f1: '75%', da_s: '100%', da_sp: '100%', da_f1: '100%', err: 0, def: '40%', tier2: true },
                  { model: 'DeepSeek v3', dev: 'DeepSeek', oss: true, fb_s: '80%', fb_sp: '80%', fb_f1: '80%', da_s: '80%', da_sp: '80%', da_f1: '80%', err: 2, def: '0%', tier2: true },
                  { model: 'Kimi k2', dev: 'Moonshot AI', oss: true, fb_s: '60%', fb_sp: '80%', fb_f1: '67%', da_s: '80%', da_sp: '80%', da_f1: '77%', err: 2, def: '10%', tier2: true },
                  { model: 'Llama 3.3 70B', dev: 'Meta', oss: true, fb_s: '80%', fb_sp: '60%', fb_f1: '73%', da_s: '80%', da_sp: '60%', da_f1: '73%', err: 3, def: '10%', tier2: true },
                  { model: 'Mistral 3.1 24B', dev: 'Mistral AI', oss: true, fb_s: '60%', fb_sp: '60%', fb_f1: '60%', da_s: '80%', da_sp: '60%', da_f1: '69%', err: 3, def: '10%', tier2: true },
                  { model: 'Gemma 3 27B', dev: 'Google', oss: true, fb_s: '80%', fb_sp: '40%', fb_f1: '67%', da_s: '80%', da_sp: '40%', da_f1: '67%', err: 4, def: '0%', tier2: true },
                  { model: 'GPT-4o', dev: 'OpenAI', oss: false, fb_s: '60%', fb_sp: '60%', fb_f1: '60%', da_s: '60%', da_sp: '60%', da_f1: '60%', err: 4, def: '0%', tier2: false },
                  { model: 'Qwen 3 235B', dev: 'Alibaba Cloud', oss: true, fb_s: '60%', fb_sp: '60%', fb_f1: '60%', da_s: '60%', da_sp: '60%', da_f1: '60%', err: 4, def: '0%', tier2: false },
                  { model: 'DeepSeek R1 32B', dev: 'DeepSeek', oss: true, fb_s: '80%', fb_sp: '20%', fb_f1: '62%', da_s: '80%', da_sp: '20%', da_f1: '62%', err: 5, def: '0%', tier2: false },
                ].map(({ model, dev, oss, fb_s, fb_sp, fb_f1, da_s, da_sp, da_f1, err, def: deferred, tier2 }) => (
                  <tr key={model} className={`hover:bg-slate-50 ${tier2 ? '' : 'opacity-60'}`}>
                    <td className="px-3 py-3 font-medium text-slate-800">{model}</td>
                    <td className="px-3 py-3 text-slate-500">
                      {dev}
                      {oss && <span className="ml-2 text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">OS</span>}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700 bg-slate-50/50">{fb_s}</td>
                    <td className="px-3 py-3 text-right text-slate-700 bg-slate-50/50">{fb_sp}</td>
                    <td className="px-3 py-3 text-right text-slate-700 bg-slate-50/50">{fb_f1}</td>
                    <td className="px-3 py-3 text-right text-blue-700 bg-blue-50/30">{da_s}</td>
                    <td className="px-3 py-3 text-right text-blue-700 bg-blue-50/30">{da_sp}</td>
                    <td className="px-3 py-3 text-right text-blue-700 bg-blue-50/30">{da_f1}</td>
                    <td className="px-3 py-3 text-right text-slate-700">{err}</td>
                    <td className="px-3 py-3 text-right text-slate-700">{deferred}</td>
                    <td className="px-3 py-3">
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
            <p>
              All models accessed via OpenRouter. Reporting Frameworks 1 (Forced Binary)
              and 3 (Deference-Aware) side by side. The gap between F1 and F3 metrics shows
              the safety gained by allowing deference. Deference rate and coverage make the
              workload trade-off explicit. Top 6 models selected for Tier 2 based on
              DA F1 and deference behavior.
            </p>
          </div>

          {/* Collapsible findings */}
          <details className="border border-slate-200 rounded-lg">
            <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Key Findings from Tier 1
            </summary>
            <div className="px-5 py-4 border-t border-slate-100 space-y-4 text-sm text-slate-600">
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Claude was the only model with zero confident errors</h4>
                <p>
                  Of 9 models tested, Claude Sonnet 4.6 was the only one to achieve
                  zero confident errors. It deferred 40% of studies to human review
                  rather than guessing — and every study it did decide on, it got right
                  (100% decided F1). This resulted in 100% DA sensitivity, 100% DA
                  specificity, and 100% DA F1. Under standard metrics, this deference
                  is penalised — Claude appears to have only 60% sensitivity.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Three models showed deference behavior</h4>
                <p>
                  Claude (40% deference), Kimi k2 (10%), and Mistral 3.1 (10%)
                  all used the UNCLEAR option at least once. Kimi k2 was the strongest
                  open source model with deference — 80% DA sensitivity and only 2
                  confident errors. Most models never deferred, committing to a decision
                  even when uncertain.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Infrastructure affects results</h4>
                <p>
                  We initially tested via Venice AI where DeepSeek timed out and Kimi
                  had 70% JSON errors. Retesting on OpenRouter, both worked perfectly
                  with zero errors. This underscores the importance of controlling for
                  infrastructure when benchmarking models.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">DeepSeek v3 was the strongest non-deferring model</h4>
                <p>
                  Among models that never deferred, DeepSeek v3 achieved the best
                  balanced performance: 80% sensitivity, 80% specificity, 80% F1 with
                  only 2 confident errors. This makes it the best open source option
                  for a forced-binary deployment where deference is not available.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Model selection for Tier 2</h4>
                <p>
                  We selected 6 models for deeper evaluation: Claude Sonnet 4.6
                  (zero errors, highest deference), Kimi k2 (best open source with
                  deference), Llama 3.3 70B (highest open source forced-binary
                  sensitivity), Mistral 3.1 24B (deference behavior), DeepSeek v3
                  (strongest balanced non-deferring model), and Gemma 3 27B (high
                  forced-binary sensitivity). GPT-4o, Qwen, and DeepSeek R1 were
                  eliminated due to higher error counts.
                </p>
              </div>
            </div>
          </details>
        </section>

        {/* Tier 2 Results */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Tier 2 Results: Donners et al. 2021</h2>
          <p className="text-sm text-slate-500 mb-4">
            Complete screening set: 258 studies (15 include, 243 exclude). Single-run per model
            via OpenRouter. PICO criteria verified from the{' '}
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8585815/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">published paper</a>.
            Raw model decisions stored for accurate forced binary metrics.
          </p>

          <div className="border border-slate-200 rounded-lg overflow-hidden mb-4 overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-3 py-3 font-medium text-slate-600" rowSpan={2}>Model</th>
                  <th className="text-center px-3 py-2 font-medium text-slate-500 bg-slate-100 border-b border-slate-200" colSpan={3}>Forced Binary (F1)</th>
                  <th className="text-center px-3 py-2 font-medium text-blue-600 bg-blue-50 border-b border-blue-100" colSpan={3}>Deference-Aware (F3)</th>
                  <th className="text-right px-3 py-3 font-medium text-slate-600" rowSpan={2}>Errors</th>
                  <th className="text-right px-3 py-3 font-medium text-slate-600" rowSpan={2}>Deferred</th>
                </tr>
                <tr>
                  <th className="text-right px-3 py-1 text-xs text-slate-400 bg-slate-100">Sens</th>
                  <th className="text-right px-3 py-1 text-xs text-slate-400 bg-slate-100">Spec</th>
                  <th className="text-right px-3 py-1 text-xs text-slate-400 bg-slate-100">F1</th>
                  <th className="text-right px-3 py-1 text-xs text-blue-400 bg-blue-50">Sens</th>
                  <th className="text-right px-3 py-1 text-xs text-blue-400 bg-blue-50">Spec</th>
                  <th className="text-right px-3 py-1 text-xs text-blue-400 bg-blue-50">F1</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { model: 'Claude Sonnet 4.6', dev: 'Anthropic', oss: false, fb_s: '73.3%', fb_sp: '95.9%', fb_f1: '61.1%', da_s: '100%', da_sp: '98.8%', da_f1: '85.7%', err: 3, def: '23.3%' },
                  { model: 'Llama 3.3 70B', dev: 'Meta', oss: true, fb_s: '93.3%', fb_sp: '74.7%', fb_f1: '31.8%', da_s: '93.3%', da_sp: '75.1%', da_f1: '32.2%', err: 59, def: '6.5%' },
                  { model: 'Mistral 3.1 24B', dev: 'Mistral AI', oss: true, fb_s: '86.7%', fb_sp: '83.5%', fb_f1: '38.2%', da_s: '93.3%', da_sp: '83.5%', da_f1: '38.9%', err: 41, def: '2.7%' },
                  { model: 'DeepSeek v3', dev: 'DeepSeek', oss: true, fb_s: '73.3%', fb_sp: '89.7%', fb_f1: '43.1%', da_s: '73.3%', da_sp: '89.7%', da_f1: '43.1%', err: 29, def: '0.4%' },
                  { model: 'Kimi k2', dev: 'Moonshot AI', oss: true, fb_s: '73.3%', fb_sp: '86.8%', fb_f1: '37.9%', da_s: '80.0%', da_sp: '86.8%', da_f1: '38.8%', err: 35, def: '1.9%' },
                  { model: 'Gemma 3 27B', dev: 'Google', oss: true, fb_s: '93.3%', fb_sp: '71.2%', fb_f1: '28.3%', da_s: '93.3%', da_sp: '71.2%', da_f1: '28.3%', err: 71, def: '0.8%' },
                ].map(({ model, dev, oss, fb_s, fb_sp, fb_f1, da_s, da_sp, da_f1, err, def: deferred }) => (
                  <tr key={model} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-800">
                      {model}
                      <span className="ml-2 text-xs text-slate-400">{dev}</span>
                      {oss && <span className="ml-1 text-xs bg-green-50 text-green-600 px-1 py-0.5 rounded">OS</span>}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700 bg-slate-50/50">{fb_s}</td>
                    <td className="px-3 py-3 text-right text-slate-700 bg-slate-50/50">{fb_sp}</td>
                    <td className="px-3 py-3 text-right text-slate-700 bg-slate-50/50">{fb_f1}</td>
                    <td className="px-3 py-3 text-right text-blue-700 bg-blue-50/30">{da_s}</td>
                    <td className="px-3 py-3 text-right text-blue-700 bg-blue-50/30">{da_sp}</td>
                    <td className="px-3 py-3 text-right text-blue-700 bg-blue-50/30">{da_f1}</td>
                    <td className="px-3 py-3 text-right text-slate-700">{err}</td>
                    <td className="px-3 py-3 text-right text-slate-700">{deferred}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details className="border border-slate-200 rounded-lg">
            <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Key Findings from Tier 2
            </summary>
            <div className="px-5 py-4 border-t border-slate-100 space-y-4 text-sm text-slate-600">
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Claude: 100% DA sensitivity, 3 confident errors</h4>
                <p>
                  Across 258 studies, Claude did not hard-miss a single included study.
                  It deferred 23.3% of studies to human review and made only 3 confident errors.
                  Under forced binary, its sensitivity drops to 73.3% — the 26.7% gap is studies
                  it would have guessed on without deference. The DA F1 (85.7%) vs forced binary
                  F1 (61.1%) captures this: deference made Claude dramatically safer.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Open source models: high sensitivity, low specificity</h4>
                <p>
                  Llama and Gemma both achieved 93.3% forced-binary sensitivity — they
                  catch most included studies. But their specificity (71-75%) and F1 (28-32%)
                  are low because they over-include. This makes them strong candidates for
                  mixed-model consensus pairing with high-specificity models.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">DeepSeek: best balance without deference</h4>
                <p>
                  DeepSeek v3 barely deferred (0.4%) but achieved the best forced-binary F1
                  among open source models (43.1%) with balanced sensitivity (73.3%) and
                  specificity (89.7%). This makes it the strongest option for deployments
                  where deference is not available.
                </p>
              </div>
            </div>
          </details>
        </section>

        {/* Tier 3b Results */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Tier 3b Results: Mixed-Model Consensus</h2>
          <p className="text-sm text-slate-500 mb-4">
            Pairing a high-sensitivity model with a high-specificity model. Agreement = decide.
            Disagreement = defer to human. Computed from Tier 2 per-study decisions — no
            additional API calls. All pairs are open source models.
          </p>

          <div className="border border-slate-200 rounded-lg overflow-hidden mb-4 overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-3 py-3 font-medium text-slate-600" rowSpan={2}>Model Pair</th>
                  <th className="text-center px-3 py-2 font-medium text-slate-500 bg-slate-100 border-b border-slate-200" colSpan={3}>Forced Binary (F1)</th>
                  <th className="text-center px-3 py-2 font-medium text-blue-600 bg-blue-50 border-b border-blue-100" colSpan={3}>Deference-Aware (F3)</th>
                  <th className="text-right px-3 py-3 font-medium text-slate-600" rowSpan={2}>Errors</th>
                  <th className="text-right px-3 py-3 font-medium text-slate-600" rowSpan={2}>Deferred</th>
                </tr>
                <tr>
                  <th className="text-right px-3 py-1 text-xs text-slate-400 bg-slate-100">Sens</th>
                  <th className="text-right px-3 py-1 text-xs text-slate-400 bg-slate-100">Spec</th>
                  <th className="text-right px-3 py-1 text-xs text-slate-400 bg-slate-100">F1</th>
                  <th className="text-right px-3 py-1 text-xs text-blue-400 bg-blue-50">Sens</th>
                  <th className="text-right px-3 py-1 text-xs text-blue-400 bg-blue-50">Spec</th>
                  <th className="text-right px-3 py-1 text-xs text-blue-400 bg-blue-50">F1</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { pair: 'Llama 70B + DeepSeek v3', fb_s: '66.7%', fb_sp: '92.7%', fb_f1: '47.6%', da_s: '100%', da_sp: '92.7%', da_f1: '54.0%', err: 17, def: '28.2%' },
                  { pair: 'Llama 70B + Kimi k2', fb_s: '66.7%', fb_sp: '90.1%', fb_f1: '41.7%', da_s: '100%', da_sp: '90.1%', da_f1: '46.5%', err: 23, def: '25.9%' },
                  { pair: 'Gemma 27B + DeepSeek v3', fb_s: '73.3%', fb_sp: '90.5%', fb_f1: '44.9%', da_s: '93.3%', da_sp: '90.5%', da_f1: '48.0%', err: 24, def: '21.3%' },
                  { pair: 'Gemma 27B + Kimi k2', fb_s: '73.3%', fb_sp: '89.3%', fb_f1: '42.3%', da_s: '93.3%', da_sp: '89.3%', da_f1: '45.1%', err: 27, def: '22.2%' },
                ].map(({ pair, fb_s, fb_sp, fb_f1, da_s, da_sp, da_f1, err, def: deferred }) => (
                  <tr key={pair} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-800">{pair}</td>
                    <td className="px-3 py-3 text-right text-slate-700 bg-slate-50/50">{fb_s}</td>
                    <td className="px-3 py-3 text-right text-slate-700 bg-slate-50/50">{fb_sp}</td>
                    <td className="px-3 py-3 text-right text-slate-700 bg-slate-50/50">{fb_f1}</td>
                    <td className="px-3 py-3 text-right text-blue-700 bg-blue-50/30">{da_s}</td>
                    <td className="px-3 py-3 text-right text-blue-700 bg-blue-50/30">{da_sp}</td>
                    <td className="px-3 py-3 text-right text-blue-700 bg-blue-50/30">{da_f1}</td>
                    <td className="px-3 py-3 text-right text-slate-700">{err}</td>
                    <td className="px-3 py-3 text-right text-slate-700">{deferred}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 border-t-2 border-slate-300">
                  <td className="px-3 py-3 font-medium text-slate-500 italic">Claude single (reference)</td>
                  <td className="px-3 py-3 text-right text-slate-500">73.3%</td>
                  <td className="px-3 py-3 text-right text-slate-500">95.9%</td>
                  <td className="px-3 py-3 text-right text-slate-500">61.1%</td>
                  <td className="px-3 py-3 text-right text-slate-500">100%</td>
                  <td className="px-3 py-3 text-right text-slate-500">98.8%</td>
                  <td className="px-3 py-3 text-right text-slate-500">85.7%</td>
                  <td className="px-3 py-3 text-right text-slate-500">3</td>
                  <td className="px-3 py-3 text-right text-slate-500">23.3%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <details className="border border-slate-200 rounded-lg">
            <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Key Findings from Tier 3b
            </summary>
            <div className="px-5 py-4 border-t border-slate-100 space-y-4 text-sm text-slate-600">
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Open source pairs match Claude's DA sensitivity at 1/15th the cost</h4>
                <p>
                  Llama + DeepSeek achieved 100% DA sensitivity — identical to Claude.
                  No included study was missed or confidently excluded. The pair cost
                  approximately $1 to run on 258 studies vs Claude's $15. For budget-constrained
                  institutions, this demonstrates that safety is achievable with open source models
                  through complementary consensus.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Specificity improved dramatically through pairing</h4>
                <p>
                  Llama alone had 74.7% specificity. Paired with DeepSeek (89.7% specificity),
                  the consensus achieves 92.7% — because the high-specificity model catches
                  false inclusions that the high-sensitivity model lets through. Disagreements
                  are deferred rather than resolved by a single model's guess.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Claude still leads on precision and total errors</h4>
                <p>
                  While open source pairs match Claude on DA sensitivity, Claude's DA F1 (85.7%)
                  remains substantially higher than the best pair (54.0%). This is because when
                  Claude decides, it's right far more often (3 errors vs 17). For workflows
                  where minimising total errors matters more than cost, Claude remains the
                  strongest single model.
                </p>
              </div>
            </div>
          </details>
        </section>

        {/* Tier 3a status */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Tier 3a: Same-Model Dual-Run Consensus</h2>
          <div className="border border-amber-200 bg-amber-50 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800 text-sm mb-1">In Progress</h3>
                <p className="text-sm text-amber-700">
                  Running same-model dual-run consensus (two passes per study, same model)
                  for Claude, DeepSeek, Mistral, and Kimi on Donners_2021. Results forthcoming.
                </p>
              </div>
            </div>
          </div>
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
