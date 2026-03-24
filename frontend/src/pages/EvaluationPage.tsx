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

        {/* Tier 1 Results — Two Tables */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Tier 1 Results: Smoke Test</h2>
          <p className="text-sm text-slate-500 mb-6">
            10 studies from Donners et al. 2021 (5 include, 5 exclude). Single-run, all models via OpenRouter.
          </p>

          {/* Table A: Forced Binary */}
          <h3 className="text-sm font-semibold text-slate-600 mb-2">Framework 1 — Forced Binary</h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden mb-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-3 py-2.5 font-medium text-slate-600">Model</th>
                  <th className="text-right px-3 py-2.5 font-medium text-slate-600">Recall</th>
                  <th className="text-right px-3 py-2.5 font-medium text-slate-600">Specificity</th>
                  <th className="text-right px-3 py-2.5 font-medium text-slate-600">Precision</th>
                  <th className="text-right px-3 py-2.5 font-medium text-slate-600">F1</th>
                  <th className="text-right px-3 py-2.5 font-medium text-slate-600">Errors</th>
                  <th className="text-left px-3 py-2.5 font-medium text-slate-600">Tier 2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { m: 'Claude Sonnet 4.6', d: 'Anthropic', oss: false, r: '60%', sp: '100%', p: '100%', f1: '75%', err: 0, t2: true, green: true },
                  { m: 'DeepSeek v3', d: 'DeepSeek', oss: true, r: '80%', sp: '80%', p: '80%', f1: '80%', err: 2, t2: true, green: false },
                  { m: 'Kimi k2', d: 'Moonshot AI', oss: true, r: '60%', sp: '80%', p: '75%', f1: '67%', err: 2, t2: true, green: false },
                  { m: 'Llama 3.3 70B', d: 'Meta', oss: true, r: '80%', sp: '60%', p: '67%', f1: '73%', err: 3, t2: true, green: false },
                  { m: 'Mistral 3.1 24B', d: 'Mistral AI', oss: true, r: '60%', sp: '60%', p: '60%', f1: '60%', err: 3, t2: true, green: false },
                  { m: 'Gemma 3 27B', d: 'Google', oss: true, r: '80%', sp: '40%', p: '57%', f1: '67%', err: 4, t2: true, green: false },
                  { m: 'GPT-4o', d: 'OpenAI', oss: false, r: '60%', sp: '60%', p: '60%', f1: '60%', err: 4, t2: false, green: false },
                  { m: 'Qwen 3 235B', d: 'Alibaba', oss: true, r: '60%', sp: '60%', p: '60%', f1: '60%', err: 4, t2: false, green: false },
                  { m: 'DeepSeek R1 32B', d: 'DeepSeek', oss: true, r: '80%', sp: '20%', p: '50%', f1: '62%', err: 5, t2: false, green: false },
                ].map(({ m, d, oss, r, sp, p, f1, err, t2, green }) => (
                  <tr key={m} className={`${green ? 'bg-green-50/50' : ''} ${!t2 ? 'opacity-50' : ''} hover:bg-slate-50`}>
                    <td className="px-3 py-2.5 font-medium text-slate-800">{m} <span className="text-xs text-slate-400">{d}</span>{oss && <span className="ml-1 text-xs bg-green-50 text-green-600 px-1 rounded">OS</span>}</td>
                    <td className="px-3 py-2.5 text-right">{r}</td>
                    <td className="px-3 py-2.5 text-right">{sp}</td>
                    <td className="px-3 py-2.5 text-right">{p}</td>
                    <td className="px-3 py-2.5 text-right font-medium">{f1}</td>
                    <td className={`px-3 py-2.5 text-right ${err >= 4 ? 'text-red-600 font-medium' : ''}`}>{err}</td>
                    <td className="px-3 py-2.5">{t2 ? <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">Yes</span> : <span className="text-xs text-slate-300">No</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table B: Deference-Aware */}
          <h3 className="text-sm font-semibold text-blue-600 mb-2">Framework 3 — Deference-Aware</h3>
          <div className="border border-blue-200 rounded-lg overflow-hidden mb-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-50 border-b border-blue-200">
                <tr>
                  <th className="text-left px-3 py-2.5 font-medium text-blue-700">Model</th>
                  <th className="text-right px-3 py-2.5 font-medium text-blue-700">DA Sens</th>
                  <th className="text-right px-3 py-2.5 font-medium text-blue-700">DA Spec</th>
                  <th className="text-right px-3 py-2.5 font-medium text-blue-700">DA F1</th>
                  <th className="text-right px-3 py-2.5 font-medium text-blue-700">Errors</th>
                  <th className="text-right px-3 py-2.5 font-medium text-blue-700">Deferred</th>
                  <th className="text-right px-3 py-2.5 font-medium text-blue-700">Coverage</th>
                  <th className="text-left px-3 py-2.5 font-medium text-blue-700">Tier 2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {[
                  { m: 'Claude Sonnet 4.6', da_s: '100%', da_sp: '100%', da_f1: '100%', err: 0, def: '40%', cov: '60%', t2: true, green: true },
                  { m: 'DeepSeek v3', da_s: '80%', da_sp: '80%', da_f1: '80%', err: 2, def: '0%', cov: '100%', t2: true, green: false },
                  { m: 'Kimi k2', da_s: '80%', da_sp: '80%', da_f1: '77%', err: 2, def: '10%', cov: '90%', t2: true, green: false },
                  { m: 'Llama 3.3 70B', da_s: '80%', da_sp: '60%', da_f1: '73%', err: 3, def: '10%', cov: '90%', t2: true, green: false },
                  { m: 'Mistral 3.1 24B', da_s: '80%', da_sp: '60%', da_f1: '69%', err: 3, def: '10%', cov: '90%', t2: true, green: false },
                  { m: 'Gemma 3 27B', da_s: '80%', da_sp: '40%', da_f1: '67%', err: 4, def: '0%', cov: '100%', t2: true, green: false },
                  { m: 'GPT-4o', da_s: '60%', da_sp: '60%', da_f1: '60%', err: 4, def: '0%', cov: '100%', t2: false, green: false },
                  { m: 'Qwen 3 235B', da_s: '60%', da_sp: '60%', da_f1: '60%', err: 4, def: '0%', cov: '100%', t2: false, green: false },
                  { m: 'DeepSeek R1 32B', da_s: '80%', da_sp: '20%', da_f1: '62%', err: 5, def: '0%', cov: '100%', t2: false, green: false },
                ].map(({ m, da_s, da_sp, da_f1, err, def: deferred, cov, t2, green }) => (
                  <tr key={m} className={`${green ? 'bg-green-50/50' : ''} ${!t2 ? 'opacity-50' : ''} hover:bg-blue-50/30`}>
                    <td className="px-3 py-2.5 font-medium text-slate-800">{m}</td>
                    <td className="px-3 py-2.5 text-right">{da_s}</td>
                    <td className="px-3 py-2.5 text-right">{da_sp}</td>
                    <td className="px-3 py-2.5 text-right font-medium">{da_f1}</td>
                    <td className={`px-3 py-2.5 text-right ${err >= 4 ? 'text-red-600 font-medium' : ''}`}>{err}</td>
                    <td className="px-3 py-2.5 text-right">{deferred}</td>
                    <td className="px-3 py-2.5 text-right">{cov}</td>
                    <td className="px-3 py-2.5">{t2 ? <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">Yes</span> : <span className="text-xs text-slate-300">No</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Read Table A then Table B: Claude drops from 60% recall in forced binary to 100%
            DA sensitivity when deference is valued. The inversion shows standard metrics penalise
            the safest model.
          </p>

          <details className="border border-slate-200 rounded-lg">
            <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Key Findings from Tier 1
            </summary>
            <div className="px-5 py-4 border-t border-slate-100 space-y-3 text-sm text-slate-600">
              <p><strong>Claude: zero confident errors.</strong> 40% deference rate, 100% DA across all metrics. Forced binary penalises this to 60% recall.</p>
              <p><strong>Three models deferred:</strong> Claude (40%), Kimi (10%), Mistral (10%). Most models never defer.</p>
              <p><strong>DeepSeek v3:</strong> Best balanced non-deferring model (80/80/80 across recall/spec/F1).</p>
              <p><strong>Infrastructure matters:</strong> DeepSeek and Kimi failed on Venice AI but worked perfectly on OpenRouter.</p>
            </div>
          </details>
        </section>

        {/* Tier 2 Results — Two Tables */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Tier 2 Results: Donners et al. 2021</h2>
          <p className="text-sm text-slate-500 mb-6">
            258 studies (15 include, 243 exclude). Single-run via OpenRouter. PICO from{' '}
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8585815/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">published paper</a>.
          </p>

          <h3 className="text-sm font-semibold text-slate-600 mb-2">Framework 1 — Forced Binary</h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden mb-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-3 py-2.5 font-medium text-slate-600">Model</th>
                  <th className="text-right px-3 py-2.5 font-medium text-slate-600">Recall</th>
                  <th className="text-right px-3 py-2.5 font-medium text-slate-600">Specificity</th>
                  <th className="text-right px-3 py-2.5 font-medium text-slate-600">Precision</th>
                  <th className="text-right px-3 py-2.5 font-medium text-slate-600">F1</th>
                  <th className="text-right px-3 py-2.5 font-medium text-slate-600">Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { m: 'Claude Sonnet 4.6', r: '73.3%', sp: '95.9%', p: '52.4%', f1: '61.1%', err: 13, green: true },
                  { m: 'Llama 3.3 70B', r: '93.3%', sp: '74.7%', p: '19.2%', f1: '31.8%', err: 62, green: false },
                  { m: 'Mistral 3.1 24B', r: '86.7%', sp: '83.5%', p: '24.5%', f1: '38.2%', err: 42, green: false },
                  { m: 'DeepSeek v3', r: '73.3%', sp: '89.7%', p: '30.6%', f1: '43.1%', err: 29, green: false },
                  { m: 'Kimi k2', r: '73.3%', sp: '86.8%', p: '25.6%', f1: '37.9%', err: 36, green: false },
                  { m: 'Gemma 3 27B', r: '93.3%', sp: '71.2%', p: '16.7%', f1: '28.3%', err: 71, green: false },
                ].map(({ m, r, sp, p, f1, err, green }) => (
                  <tr key={m} className={`${green ? 'bg-green-50/50' : ''} hover:bg-slate-50`}>
                    <td className="px-3 py-2.5 font-medium text-slate-800">{m}</td>
                    <td className="px-3 py-2.5 text-right">{r}</td>
                    <td className="px-3 py-2.5 text-right">{sp}</td>
                    <td className="px-3 py-2.5 text-right">{p}</td>
                    <td className="px-3 py-2.5 text-right font-medium">{f1}</td>
                    <td className={`px-3 py-2.5 text-right ${err >= 40 ? 'text-red-600 font-medium' : ''}`}>{err}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-sm font-semibold text-blue-600 mb-2">Framework 3 — Deference-Aware</h3>
          <div className="border border-blue-200 rounded-lg overflow-hidden mb-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-50 border-b border-blue-200">
                <tr>
                  <th className="text-left px-3 py-2.5 font-medium text-blue-700">Model</th>
                  <th className="text-right px-3 py-2.5 font-medium text-blue-700">DA Sens</th>
                  <th className="text-right px-3 py-2.5 font-medium text-blue-700">DA Spec</th>
                  <th className="text-right px-3 py-2.5 font-medium text-blue-700">DA F1</th>
                  <th className="text-right px-3 py-2.5 font-medium text-blue-700">Errors</th>
                  <th className="text-right px-3 py-2.5 font-medium text-blue-700">Deferred</th>
                  <th className="text-right px-3 py-2.5 font-medium text-blue-700">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {[
                  { m: 'Claude Sonnet 4.6', da_s: '100%', da_sp: '98.8%', da_f1: '85.7%', err: 3, def: '23.3%', cov: '76.7%', green: true },
                  { m: 'Llama 3.3 70B', da_s: '93.3%', da_sp: '75.1%', da_f1: '32.2%', err: 59, def: '6.5%', cov: '93.5%', green: false },
                  { m: 'Mistral 3.1 24B', da_s: '93.3%', da_sp: '83.5%', da_f1: '38.9%', err: 41, def: '2.7%', cov: '97.3%', green: false },
                  { m: 'DeepSeek v3', da_s: '73.3%', da_sp: '89.7%', da_f1: '43.1%', err: 29, def: '0.4%', cov: '99.6%', green: false },
                  { m: 'Kimi k2', da_s: '80.0%', da_sp: '86.8%', da_f1: '38.8%', err: 35, def: '1.9%', cov: '98.1%', green: false },
                  { m: 'Gemma 3 27B', da_s: '93.3%', da_sp: '71.2%', da_f1: '28.3%', err: 71, def: '0.8%', cov: '99.2%', green: false },
                ].map(({ m, da_s, da_sp, da_f1, err, def: deferred, cov, green }) => (
                  <tr key={m} className={`${green ? 'bg-green-50/50' : ''} hover:bg-blue-50/30`}>
                    <td className="px-3 py-2.5 font-medium text-slate-800">{m}</td>
                    <td className="px-3 py-2.5 text-right">{da_s}</td>
                    <td className="px-3 py-2.5 text-right">{da_sp}</td>
                    <td className="px-3 py-2.5 text-right font-medium">{da_f1}</td>
                    <td className={`px-3 py-2.5 text-right ${err >= 40 ? 'text-red-600 font-medium' : ''}`}>{err}</td>
                    <td className="px-3 py-2.5 text-right">{deferred}</td>
                    <td className="px-3 py-2.5 text-right">{cov}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Claude inverts: 73.3% recall in forced binary becomes 100% DA sensitivity. The gap (26.7%)
            represents studies deferred rather than guessed wrong. DA F1 jumps from 61.1% to 85.7%.
          </p>

          <details className="border border-slate-200 rounded-lg">
            <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Key Findings from Tier 2
            </summary>
            <div className="px-5 py-4 border-t border-slate-100 space-y-3 text-sm text-slate-600">
              <p><strong>Claude: 100% DA sensitivity, 3 errors.</strong> Zero hard misses — every included study was either correctly included or deferred. Forced binary F1 (61.1%) vs DA F1 (85.7%) is the clearest demonstration of the framework inversion.</p>
              <p><strong>Llama + Gemma: high recall, low precision.</strong> 93.3% forced-binary recall but F1 under 32% due to massive over-inclusion. Good candidates for mixed-model pairing with high-specificity models.</p>
              <p><strong>DeepSeek: best balance without deference.</strong> 43.1% forced-binary F1 with 89.7% specificity. Barely defers (0.4%). Strongest option for fully automated deployments.</p>
            </div>
          </details>
        </section>

        {/* Tier 3a: Same-Model Dual-Run */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Tier 3a: Same-Model Dual-Run Consensus</h2>
          <p className="text-sm text-slate-500 mb-4">
            Each model run twice on the same 258 studies (Run 1: temp=0, Run 2: temp=0.3).
            Agreement with high confidence = decide. Disagreement or low confidence = defer.
            Compared against single-run DA results from Tier 2.
          </p>

          <h3 className="text-sm font-semibold text-blue-600 mb-2">Single-Run vs Dual-Run (Deference-Aware)</h3>
          <div className="border border-blue-200 rounded-lg overflow-hidden mb-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-50 border-b border-blue-200">
                <tr>
                  <th className="text-left px-3 py-2.5 font-medium text-blue-700" rowSpan={2}>Model</th>
                  <th className="text-center px-3 py-2 font-medium text-slate-500 border-b border-slate-200" colSpan={3}>Single-Run DA (Tier 2)</th>
                  <th className="text-center px-3 py-2 font-medium text-blue-700 border-b border-blue-200" colSpan={3}>Dual-Run DA (Tier 3a)</th>
                  <th className="text-center px-3 py-2 font-medium text-slate-600 border-b border-slate-200" colSpan={2}>Dual-Run Detail</th>
                </tr>
                <tr>
                  <th className="text-right px-3 py-1 text-xs text-slate-400">Sens</th>
                  <th className="text-right px-3 py-1 text-xs text-slate-400">Errors</th>
                  <th className="text-right px-3 py-1 text-xs text-slate-400">Def%</th>
                  <th className="text-right px-3 py-1 text-xs text-blue-500">Sens</th>
                  <th className="text-right px-3 py-1 text-xs text-blue-500">Errors</th>
                  <th className="text-right px-3 py-1 text-xs text-blue-500">Def%</th>
                  <th className="text-right px-3 py-1 text-xs text-slate-400">Hard Miss</th>
                  <th className="text-right px-3 py-1 text-xs text-slate-400">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {[
                  { m: 'Claude Sonnet 4.6', s1_s: '100%', s1_e: 3, s1_d: '23.3%', s2_s: '100%', s2_e: 3, s2_d: '25.2%', hm: 0, cov: '74.8%', green: true },
                  { m: 'Mistral 3.1 24B', s1_s: '93.3%', s1_e: 41, s1_d: '2.7%', s2_s: '93.3%', s2_e: 39, s2_d: '6.6%', hm: 1, cov: '93.4%', green: false },
                  { m: 'Kimi k2', s1_s: '80.0%', s1_e: 35, s1_d: '1.9%', s2_s: '80.0%', s2_e: 28, s2_d: '6.6%', hm: 3, cov: '93.4%', green: false },
                  { m: 'DeepSeek v3', s1_s: '73.3%', s1_e: 29, s1_d: '0.4%', s2_s: '73.3%', s2_e: 29, s2_d: '0.4%', hm: 4, cov: '99.6%', green: false },
                ].map(({ m, s1_s, s1_e, s1_d, s2_s, s2_e, s2_d, hm, cov, green }) => (
                  <tr key={m} className={`${green ? 'bg-green-50/50' : ''} hover:bg-blue-50/30`}>
                    <td className="px-3 py-2.5 font-medium text-slate-800">{m}</td>
                    <td className="px-3 py-2.5 text-right text-slate-500">{s1_s}</td>
                    <td className="px-3 py-2.5 text-right text-slate-500">{s1_e}</td>
                    <td className="px-3 py-2.5 text-right text-slate-500">{s1_d}</td>
                    <td className="px-3 py-2.5 text-right text-blue-700 font-medium">{s2_s}</td>
                    <td className="px-3 py-2.5 text-right text-blue-700 font-medium">{s2_e}</td>
                    <td className="px-3 py-2.5 text-right text-blue-700">{s2_d}</td>
                    <td className={`px-3 py-2.5 text-right ${hm > 0 ? 'text-red-600' : 'text-green-600 font-medium'}`}>{hm}</td>
                    <td className="px-3 py-2.5 text-right">{cov}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details className="border border-slate-200 rounded-lg">
            <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Key Findings from Tier 3a
            </summary>
            <div className="px-5 py-4 border-t border-slate-100 space-y-3 text-sm text-slate-600">
              <p><strong>Claude: zero hard misses under dual-run.</strong> All 6 uncertain included studies were deferred. Only 3 false includes (conference abstracts). Dual-run slightly increased deference (23.3% → 25.2%).</p>
              <p><strong>Dual-run helps models with existing uncertainty.</strong> Mistral and Kimi both increased deference from ~2% to ~7%, reducing errors. But DeepSeek, which is always confident, saw no change — its two runs almost always agreed.</p>
              <p><strong>Dual-run amplifies existing behavior, it doesn't create it.</strong> Models that already defer (Claude) get slightly more conservative. Models that never defer (DeepSeek) stay the same. The consensus mechanism works best when there's genuine instability to detect.</p>
            </div>
          </details>
        </section>

        {/* Tier 3b: Mixed-Model */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Tier 3b: Mixed-Model Consensus</h2>
          <p className="text-sm text-slate-500 mb-2">
            Pairing a high-sensitivity open source model with a high-specificity one.
            Agreement = decide. Disagreement = defer. Computed from Tier 2 data — no additional API calls.
          </p>
          <p className="text-xs text-slate-400 mb-4">
            Forced binary is not applicable to consensus pairs (disagreement has no single raw decision).
          </p>

          <div className="border border-blue-200 rounded-lg overflow-hidden mb-6 overflow-x-auto">
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
                {[
                  { pair: 'Llama 70B + DeepSeek v3', da_s: '100%', da_sp: '92.7%', da_f1: '54.0%', err: 17, def: '28.2%', cov: '71.8%' },
                  { pair: 'Llama 70B + Kimi k2', da_s: '100%', da_sp: '90.1%', da_f1: '46.5%', err: 23, def: '25.9%', cov: '74.1%' },
                  { pair: 'Gemma 27B + DeepSeek v3', da_s: '93.3%', da_sp: '90.5%', da_f1: '48.0%', err: 24, def: '21.3%', cov: '78.7%' },
                  { pair: 'Gemma 27B + Kimi k2', da_s: '93.3%', da_sp: '89.3%', da_f1: '45.1%', err: 27, def: '22.2%', cov: '77.8%' },
                ].map(({ pair, da_s, da_sp, da_f1, err, def: deferred, cov }) => (
                  <tr key={pair} className="hover:bg-blue-50/30">
                    <td className="px-3 py-2.5 font-medium text-slate-800">{pair}</td>
                    <td className="px-3 py-2.5 text-right">{da_s}</td>
                    <td className="px-3 py-2.5 text-right">{da_sp}</td>
                    <td className="px-3 py-2.5 text-right font-medium">{da_f1}</td>
                    <td className="px-3 py-2.5 text-right">{err}</td>
                    <td className="px-3 py-2.5 text-right">{deferred}</td>
                    <td className="px-3 py-2.5 text-right">{cov}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 border-t-2 border-slate-300">
                  <td className="px-3 py-2.5 font-medium text-slate-400 italic">Claude single (ref)</td>
                  <td className="px-3 py-2.5 text-right text-slate-400">100%</td>
                  <td className="px-3 py-2.5 text-right text-slate-400">98.8%</td>
                  <td className="px-3 py-2.5 text-right text-slate-400">85.7%</td>
                  <td className="px-3 py-2.5 text-right text-slate-400">3</td>
                  <td className="px-3 py-2.5 text-right text-slate-400">23.3%</td>
                  <td className="px-3 py-2.5 text-right text-slate-400">76.7%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <details className="border border-slate-200 rounded-lg">
            <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Key Findings from Tier 3b
            </summary>
            <div className="px-5 py-4 border-t border-slate-100 space-y-3 text-sm text-slate-600">
              <p><strong>Llama + DeepSeek: 100% DA sensitivity at 1/15th the cost of Claude.</strong> No included study was missed or confidently excluded. ~$1 vs Claude's ~$15.</p>
              <p><strong>Pairing boosts specificity.</strong> Llama alone: 74.7% specificity. Llama + DeepSeek: 92.7%. The high-specificity model catches over-inclusions.</p>
              <p><strong>Claude still leads on precision.</strong> DA F1: Claude 85.7% vs best pair 54.0%. When Claude decides, it's right far more often (3 errors vs 17).</p>
              <p><strong>3a vs 3b:</strong> Same-model dual-run (3a) amplifies existing deference. Mixed-model consensus (3b) creates deference from disagreement between complementary models. Both achieve deference, through different mechanisms.</p>
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
