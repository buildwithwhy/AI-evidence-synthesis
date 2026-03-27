import PublicNav from '../components/PublicNav'
import Footer from '../components/Footer'
import { ForcedBinaryTable, PartialEvalTable, DeferenceAwareTable, DualRunTable, MixedConsensusTable } from '../components/EvalTables'
import { tier1Results, tier2Results, tier3aResults, tier3bResults, claudeReference } from '../data/benchmarkResults'
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

        {/* Status note */}
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 mb-10">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              All results below are from <strong>Level 1 (title and abstract) screening</strong> on
              the Donners et al. 2021 dataset (258 studies). Full-text (Level 2) screening
              and additional review datasets are planned.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-10">
          By Yuyu Shen, KalliDao Research. Methodology formalised in{' '}
          <em>Deference-Aware Evaluation for Human-in-the-Loop AI Systems:
          A Unified Quality Signal for AI Systems Operating Under Human Oversight</em>{' '}
          (KalliDao Research, March 2026). CC BY 4.0.
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
              At Level 1 (title/abstract) screening, the field correctly prioritises
              <strong> sensitivity/recall</strong> — missing a relevant study at this stage
              is irrecoverable. We agree. But current tools achieve high sensitivity by
              chronically sacrificing specificity: they over-include to avoid missing anything,
              flooding human reviewers with irrelevant studies. This is treated as an
              acceptable trade-off.
            </p>
            <p>
              We argue it is not acceptable — it is a <strong>symptom of forced-binary
              evaluation</strong>, not a fundamental property of the screening task. When
              the AI must commit to INCLUDE or EXCLUDE on every study, the only way to
              avoid missing relevant ones is to include too many irrelevant ones. But when
              the AI can say UNSURE, it exits this trade-off on uncertain cases entirely —
              deferring to a human rather than guessing. Under deference-aware evaluation,
              <strong>all three core metrics can be high simultaneously</strong>:
            </p>
            <ul className="space-y-3 ml-1">
              <li>
                <strong>Sensitivity/recall</strong> remains paramount — missing a relevant study
                still undermines the review. DA evaluation counts deferred studies as caught,
                so the AI achieves high sensitivity without over-including.
              </li>
              <li>
                <strong>Specificity</strong> matters because if the AI floods reviewers with
                noise, reviewer fatigue leads to less careful assessment of each study —
                defeating the purpose of human oversight.
              </li>
              <li>
                <strong>Precision</strong> matters because if most of what the AI marks as
                INCLUDE is irrelevant, reviewers learn to distrust the AI's decisions and
                either rubber-stamp them (introducing errors) or re-screen everything
                manually (negating the efficiency gain).
              </li>
            </ul>
            <p>
              A tool that catches every relevant study but also marks half the irrelevant
              ones as INCLUDE has not meaningfully helped the reviewer. The forced-binary
              framework treats this as an unavoidable cost of high sensitivity. The
              deference-aware framework shows it is avoidable.
            </p>
          </div>
        </section>

        {/* Key Metrics Explained */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Key Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: 'Sensitivity / Recall',
                target: '> 95%',
                desc: 'Of all studies that SHOULD be included, what percentage did the AI catch? Missing relevant studies undermines the entire review. These terms are interchangeable — we use both throughout.',
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
                desc: 'The harmonic mean of precision and sensitivity/recall. Balances catching all relevant studies against not overwhelming reviewers with false positives. Ranges from 0 to 1, where 1 is perfect.',
                critical: false,
              },
              {
                name: 'Confident Errors',
                target: '0',
                desc: 'The number of studies where the AI made a confident wrong decision — either including an irrelevant study or excluding a relevant one. In the deference-aware framework, these are the only true failures.',
                critical: true,
              },
              {
                name: 'Deference Rate / Coverage',
                target: 'Varies',
                desc: 'Deference rate: what percentage of studies the AI flagged for human review. Coverage: the complement — what percentage the AI handled autonomously. Higher deference = safer but more human workload.',
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
                  The AI produces only INCLUDE or EXCLUDE, evaluated on standard sensitivity/recall,
                  specificity, precision, and F1. This is the appropriate baseline for fully automated
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
                  <li><strong>DA Sensitivity/Recall:</strong> Of all studies that should be included, how many did the AI either correctly include OR defer? Only confident exclusions of included studies count as failures.</li>
                  <li><strong>DA Specificity:</strong> Of all studies that should be excluded, how many did the AI either correctly exclude OR defer? Only confident inclusions of excluded studies count as failures.</li>
                  <li><strong>DA F1:</strong> Harmonic mean of DA sensitivity/recall and decided precision. Balances safety (catching included studies or deferring) with quality (when you say INCLUDE, being right).</li>
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
              We report all three frameworks in our results: Framework 1 as the traditional
              baseline, Framework 2 to show how partial evaluation inflates metrics, and
              Framework 3 as the unified quality signal. The gap between F1 and F3 shows
              how much safety is gained by allowing deference. This applies to any domain
              where AI operates under human oversight — not just systematic reviews.
              This is formalised in: <em>Deference-Aware Evaluation for Human-in-the-Loop
              AI Systems: A Unified Quality Signal for AI Systems Operating Under Human
              Oversight</em> (Yuyu Shen, KalliDao Research, March 2026). CC BY 4.0.
            </p>
          </div>
        </section>

        {/* Datasets */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Benchmark Datasets</h2>

          <div className="space-y-4 mb-6">
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

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-2">What we actually evaluated on</h3>
            <p className="text-sm text-slate-600 mb-3">
              The results on this page use a single review from the SYNERGY dataset:
              <strong>Donners et al. 2021</strong> — a systematic review of emicizumab
              pharmacokinetics in hemophilia A (258 studies, 15 included, 243 excluded).
              We chose this review because it has a complete screening set with
              PICO criteria{' '}
              <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8585815/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">verified from the published paper</a>.
            </p>
            <p className="text-sm text-slate-600 mb-3">
              This is a deliberate limitation: we prioritised having one review with
              verified ground truth over testing on more reviews with approximated criteria.
              Evaluating with incorrect PICO would measure the wrong thing.
            </p>
            <p className="text-sm text-slate-600">
              <strong>Planned expansions:</strong> We have verified PICO criteria prepared
              for two additional SYNERGY reviews — Sep et al. 2021 (271 studies) and
              Meijboom et al. 2021 (882 studies). Evaluations on these reviews, as well as
              the larger Chan et al. dataset, are forthcoming.
            </p>
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
                studies: '1,411 studies',
                desc: 'Complete screening sets from 3 verified reviews (Donners 258, Sep 271, Meijboom 882) with PICO criteria extracted from published papers. Covers human pharmacology, preclinical research, and clinical biosimilars.',
              },
              {
                tier: 'Tier 3a: Same-Model Dual-Run',
                studies: 'Tier 2 dataset',
                desc: 'Run the same model twice per study (temp=0 and temp=0.3) and apply consensus. Tests whether dual-run amplifies deference and reduces confident errors compared to single-run.',
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
                  performers from Tier 1 — typically 3-6 models — are run on the full
                  Donners_2021 review (258 studies, complete screening set). This produces
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

          <h3 className="text-sm font-semibold text-slate-600 mb-2">Framework 1 — Forced Binary</h3>
          <ForcedBinaryTable data={tier1Results} errorThreshold={4} showTier2 />
          <div className="mb-6" />

          <h3 className="text-sm font-semibold text-blue-600 mb-2">Framework 3 — Deference-Aware</h3>
          <DeferenceAwareTable data={tier1Results} errorThreshold={4} showTier2 />
          <p className="text-xs text-slate-400 mt-2 mb-4">
            Compare the two tables above: Claude drops from 60% sens/recall (Framework 1) to 100%
            DA sens/recall (Framework 3). The inversion shows standard metrics penalise the safest model.
          </p>

          <details className="border border-slate-200 rounded-lg">
            <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Key Findings from Tier 1
            </summary>
            <div className="px-5 py-4 border-t border-slate-100 space-y-3 text-sm text-slate-600">
              <p><strong>Claude: zero confident errors.</strong> 40% deference rate, 100% DA across all metrics. Forced binary penalises this to 60% sens/recall.</p>
              <p><strong>Three models deferred:</strong> Claude (40%), Kimi (10%), Mistral (10%). Most models never defer.</p>
              <p><strong>DeepSeek v3:</strong> Best balanced non-deferring model (80/80/80 across sens/recall, specificity, F1).</p>
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
          <ForcedBinaryTable data={tier2Results} />
          <div className="mb-6" />

          <h3 className="text-sm font-semibold text-amber-600 mb-2">Framework 2 — Partial Evaluation <span className="text-xs font-normal text-amber-400">(decided subset only)</span></h3>
          <PartialEvalTable data={tier2Results} />
          <p className="text-xs text-slate-400 mt-2 mb-6">
            Claude scores 100% sens/recall and 85.7% F1 — but only on 76.7% of studies.
            The remaining 23.3% are excluded from the denominator, hiding the deferred workload.
          </p>

          <h3 className="text-sm font-semibold text-blue-600 mb-2">Framework 3 — Deference-Aware</h3>
          <DeferenceAwareTable data={tier2Results} />
          <p className="text-xs text-slate-400 mt-2 mb-4">
            F2 and F3 share the same precision (75.0% for Claude) — UNSURE is never an INCLUDE call,
            so precision is computed over the same set of confident INCLUDEs in both frameworks.
            The difference: F2 hides 23.3% in the denominator, F3 reports it as deferred.
          </p>

          <details className="border border-slate-200 rounded-lg">
            <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Key Findings from Tier 2
            </summary>
            <div className="px-5 py-4 border-t border-slate-100 space-y-3 text-sm text-slate-600">
              <p><strong>Claude: 100% DA sens/recall, 3 errors.</strong> Zero hard misses — every included study was either correctly included or deferred. Forced binary F1 (61.1%) vs DA F1 (85.7%) is the clearest demonstration of the framework inversion.</p>
              <p><strong>Llama + Gemma: high sens/recall, low precision.</strong> 93.3% forced-binary sens/recall but F1 under 32% due to massive over-inclusion. Good candidates for mixed-model pairing with high-specificity models.</p>
              <p><strong>DeepSeek: best balance without deference.</strong> 43.1% forced-binary F1 with 89.7% specificity. Barely defers (0.4%). Strongest option for fully automated deployments.</p>
            </div>
          </details>
        </section>

        {/* Dual-run explanation — before 3a results */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Dual-Run Consensus</h2>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-sm text-slate-600 space-y-3">
            <p>
              Our production screening engine runs each study through the AI twice — once
              deterministically (temp=0) and once with slight variation (temp=0.3) to probe
              decision stability. The consensus logic:
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

        {/* Tier 3a: Same-Model Dual-Run */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Tier 3a: Same-Model Dual-Run Consensus</h2>
          <p className="text-sm text-slate-500 mb-4">
            Each model run twice on the same 258 studies (Run 1: temp=0, Run 2: temp=0.3).
            Agreement with high confidence = decide. Disagreement or low confidence = defer.
            Compared against single-run DA results from Tier 2.
          </p>

          <h3 className="text-sm font-semibold text-blue-600 mb-2">Single-Run vs Dual-Run (Deference-Aware)</h3>
          <DualRunTable data={tier3aResults} />
          <div className="mb-4" />

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

          <MixedConsensusTable data={tier3bResults} reference={claudeReference} />
          <div className="mb-4" />

          <details className="border border-slate-200 rounded-lg">
            <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Key Findings from Tier 3b
            </summary>
            <div className="px-5 py-4 border-t border-slate-100 space-y-3 text-sm text-slate-600">
              <p><strong>Llama + DeepSeek: 100% DA sens/recall, zero H.Miss, at 1/15th the cost of Claude.</strong> No included study was missed or confidently excluded. All 17 errors are false positives (over-includes), not false negatives — extra work for reviewers but no missed studies. ~$1 vs Claude's ~$15.</p>
              <p><strong>Pairing boosts specificity.</strong> Llama alone: 74.7% specificity. Llama + DeepSeek: 92.7%. The high-specificity model catches over-inclusions.</p>
              <p><strong>Claude still leads on precision.</strong> DA F1: Claude 85.7% vs best pair 54.0%. When Claude decides, it's right far more often (3 errors vs 17). But critically, both achieve zero H.Miss — the difference is entirely in false positives.</p>
              <p><strong>3a vs 3b:</strong> Same-model dual-run (3a) amplifies existing deference. Mixed-model consensus (3b) creates deference from disagreement between complementary models. Both achieve deference, through different mechanisms.</p>
            </div>
          </details>
        </section>

      </div>

      <Footer />
    </div>
  )
}
