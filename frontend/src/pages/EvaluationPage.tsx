import PublicNav from '../components/PublicNav'
import Footer from '../components/Footer'
import { ForcedBinaryTable, PartialEvalTable, DeferenceAwareTable, DualRunTable, MixedConsensusTable } from '../components/EvalTables'
import { tier1Results, tier2Results, tier3aResults, tier3bResults, claudeReference } from '../data/benchmarkResults'
import { CheckCircle, AlertTriangle } from 'lucide-react'

const PAPER_URL = "https://osf.io/a69yh/files/vj95h"

export default function EvaluationPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Evaluation</h1>
        <p className="text-slate-500 mb-2">
          How we test our screening engine across 9 LLM models, and why standard metrics
          get the ranking wrong.
        </p>
        <p className="text-xs text-slate-400 mb-10">
          By Yuyu Shen, Hopperlace Research. Full methodology in{' '}
          <a href={PAPER_URL} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
            <em>Deference-Aware Evaluation for Human-in-the-Loop AI Systems</em>
          </a>{' '}
          (March 2026, CC BY 4.0).
        </p>

        {/* The core argument — concise */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">The Problem with Standard Evaluation</h2>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-slate-600">
            <p>
              Standard AI evaluation treats every wrong answer the same — a confident error
              and an uncertain guess count equally. In human-in-the-loop systems, this is
              the wrong incentive. When an AI correctly identifies that a case is ambiguous
              and defers to a human expert, it has <strong>behaved correctly</strong>. Standard
              metrics penalise this, creating systematic pressure toward overconfident AI.
            </p>
            <p>
              This is not just an abstract concern. In systematic review screening, current
              tools sacrifice specificity to maximise sensitivity — flooding reviewers with
              irrelevant studies to avoid missing relevant ones. We argue this trade-off is
              a <strong>symptom of forced-binary evaluation</strong>, not a fundamental property
              of the task. When the AI can say UNSURE, it exits the trade-off entirely.
            </p>
            <p>
              The normative claim: in high-stakes domains, uncertain decisions belong to
              humans — not only because experts may outperform AI on ambiguous cases, but
              because human agency over consequential decisions is a value worth preserving.
              <a href={PAPER_URL} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline ml-1">
                Full argument in the paper →
              </a>
            </p>
          </div>
        </section>

        {/* Three frameworks — compact */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Three Evaluation Frameworks</h2>
          <div className="space-y-3">
            <div className="bg-white border border-slate-200 rounded-md p-4">
              <h4 className="font-semibold text-slate-700 mb-1 text-sm">Framework 1: Forced Binary</h4>
              <p className="text-xs text-slate-500">
                AI produces only INCLUDE or EXCLUDE. The traditional baseline. No room for uncertainty.
              </p>
            </div>
            <div className="bg-white border border-amber-200 rounded-md p-4">
              <h4 className="font-semibold text-amber-700 mb-1 text-sm">
                Framework 2: Partial Evaluation
                <span className="ml-2 text-xs font-normal text-amber-500">(flawed)</span>
              </h4>
              <p className="text-xs text-slate-500">
                AI can output UNSURE, but deferred cases are excluded from the denominator.
                A system deferring 80% and scoring 99% on the rest looks great — but that 80%
                still needs a human.{' '}
                <a href={PAPER_URL} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Why this fails →</a>
              </p>
            </div>
            <div className="bg-white border border-blue-200 rounded-md p-4">
              <h4 className="font-semibold text-blue-700 mb-1 text-sm">Framework 3: Deference-Aware</h4>
              <p className="text-xs text-slate-500 mb-2">
                UNSURE counts as correct. The only failures are confident wrong answers.
                Workload is reported explicitly, not hidden.
              </p>
              <div className="text-xs text-slate-500 bg-slate-50 rounded p-3 font-mono">
                <div>AI says INCLUDE, truth is INCLUDE → Correct</div>
                <div>AI says EXCLUDE, truth is EXCLUDE → Correct</div>
                <div>AI says UNSURE (either truth) → <span className="text-blue-600 font-semibold">Correct (deferred)</span></div>
                <div>AI says INCLUDE, truth is EXCLUDE → <span className="text-red-600 font-semibold">Incorrect</span></div>
                <div>AI says EXCLUDE, truth is INCLUDE → <span className="text-red-600 font-semibold">Incorrect</span></div>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            The confidence threshold triggering UNSURE (default 85%) is tunable per domain.
            Some models (notably Claude) also output UNSURE on their own initiative.
          </p>
        </section>

        {/* Dataset — brief */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Dataset</h2>
          <p className="text-sm text-slate-600 mb-3">
            All results below are from <strong>Level 1 (title and abstract) screening</strong> on
            <strong> Donners et al. 2021</strong> — a systematic review of emicizumab pharmacokinetics
            in hemophilia A (258 studies, 15 included, 243 excluded). PICO criteria{' '}
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8585815/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">verified from the published paper</a>.
            Source: SYNERGY dataset (CC0).
          </p>
          <p className="text-xs text-slate-400">
            9 models evaluated at Tier 1, 6 advanced to Tier 2.
            Additional reviews (Sep 2021, Meijboom 2021) and Level 2 evaluation planned.{' '}
            <a href={PAPER_URL} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Dataset details in the paper →</a>
          </p>
        </section>

        {/* Tier 1 Results */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Tier 1: Smoke Test</h2>
          <p className="text-sm text-slate-500 mb-6">
            10 studies (5 include, 5 exclude). Single-run, all models via OpenRouter.
          </p>

          <h3 className="text-sm font-semibold text-slate-600 mb-2">Framework 1 — Forced Binary</h3>
          <ForcedBinaryTable data={tier1Results} errorThreshold={4} showTier2 />
          <div className="mb-6" />

          <h3 className="text-sm font-semibold text-blue-600 mb-2">Framework 3 — Deference-Aware</h3>
          <DeferenceAwareTable data={tier1Results} errorThreshold={4} showTier2 />
          <p className="text-xs text-slate-400 mt-2 mb-4">
            Claude drops from 60% sens/recall (F1) to 100% DA sens/recall (F3) — standard metrics
            penalise the only model with zero confident errors.
          </p>

          <details className="border border-slate-200 rounded-lg">
            <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Key Findings
            </summary>
            <div className="px-5 py-4 border-t border-slate-100 space-y-3 text-sm text-slate-600">
              <p><strong>Claude: zero confident errors.</strong> 40% deference, 100% DA across all metrics. Standard metrics rank it last.</p>
              <p><strong>Three models deferred:</strong> Claude (40%), Kimi (10%), Mistral (10%). Most never defer.</p>
              <p><strong>DeepSeek v3:</strong> Best balanced non-deferring model (80/80/80).</p>
            </div>
          </details>
        </section>

        {/* Tier 2 Results */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Tier 2: Core Evaluation (258 studies)</h2>
          <p className="text-sm text-slate-500 mb-6">
            Complete screening set. Single-run via OpenRouter.
          </p>

          <h3 className="text-sm font-semibold text-slate-600 mb-2">Framework 1 — Forced Binary</h3>
          <ForcedBinaryTable data={tier2Results} />
          <div className="mb-6" />

          <h3 className="text-sm font-semibold text-amber-600 mb-2">Framework 2 — Partial Evaluation <span className="text-xs font-normal text-amber-400">(decided subset only)</span></h3>
          <PartialEvalTable data={tier2Results} />
          <p className="text-xs text-slate-400 mt-2 mb-6">
            Claude shows 100% recall — but only on 76.7% of studies. The rest are hidden.
          </p>

          <h3 className="text-sm font-semibold text-blue-600 mb-2">Framework 3 — Deference-Aware</h3>
          <DeferenceAwareTable data={tier2Results} />
          <p className="text-xs text-slate-400 mt-2 mb-4">
            Same precision as F2 (UNSURE is never an INCLUDE call). The difference: F3 makes
            the 23.3% deferred workload visible instead of hiding it in the denominator.
          </p>

          <details className="border border-slate-200 rounded-lg">
            <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Key Findings
            </summary>
            <div className="px-5 py-4 border-t border-slate-100 space-y-3 text-sm text-slate-600">
              <p><strong>Claude: 100% DA sens/recall, 0 H.Miss, 3 confident errors.</strong> Every included study was correctly included or deferred. F1 (61.1%) vs DA F1 (85.7%) — the framework inversion on 258 studies.</p>
              <p><strong>The F2 denominator trap demonstrated:</strong> Same model, same data — 100% recall (F2) vs 73.3% recall (F1). The discrepancy is the denominator, not the model.</p>
              <p><strong>Open source models:</strong> High sensitivity (93%), low precision (17-25%), many errors (41-71). Good for mixed-model pairing.</p>
            </div>
          </details>
        </section>

        {/* Dual-run explanation — brief */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Dual-Run Consensus</h2>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-sm text-slate-600 space-y-2">
            <p>Each study screened twice (temp=0 and temp=0.3). Consensus logic:</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span><strong>Both agree + high confidence:</strong> Decision accepted</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span><strong>Low confidence or disagreement:</strong> Flagged for human review</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tier 3a */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Tier 3a: Same-Model Dual-Run</h2>
          <p className="text-sm text-slate-500 mb-4">
            Single-run vs dual-run DA metrics on 258 studies.
          </p>

          <DualRunTable data={tier3aResults} />
          <div className="mb-4" />

          <details className="border border-slate-200 rounded-lg">
            <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Key Findings
            </summary>
            <div className="px-5 py-4 border-t border-slate-100 space-y-3 text-sm text-slate-600">
              <p><strong>Claude: 0 H.Miss in both runs.</strong> Dual-run adds marginal deference (23.3% → 25.2%) with no change in errors.</p>
              <p><strong>Dual-run amplifies existing deference, doesn't create it.</strong> Mistral and Kimi improved. DeepSeek unchanged — too consistently decisive.</p>
            </div>
          </details>
        </section>

        {/* Tier 3b */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Tier 3b: Mixed-Model Consensus</h2>
          <p className="text-sm text-slate-500 mb-2">
            High-sensitivity + high-specificity open source pairs. Agreement = decide, disagreement = defer.
          </p>
          <p className="text-xs text-slate-400 mb-4">
            Computed from Tier 2 data — no additional API calls.
          </p>

          <MixedConsensusTable data={tier3bResults} reference={claudeReference} />
          <div className="mb-4" />

          <details className="border border-slate-200 rounded-lg">
            <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Key Findings
            </summary>
            <div className="px-5 py-4 border-t border-slate-100 space-y-3 text-sm text-slate-600">
              <p><strong>Llama + DeepSeek: 100% DA sensitivity, 0 H.Miss, ~$1.</strong> All 17 errors are false positives — extra reviewer work but no missed studies. Claude achieves the same safety at $15 with only 3 errors.</p>
              <p><strong>The deployment trade-off made legible:</strong> Both achieve zero H.Miss. The difference is 14 false positives (reviewer workload) and 15x cost. DA evaluation makes both sides quantifiable.</p>
            </div>
          </details>
        </section>

        {/* Diagnostic value */}
        <section className="mb-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
            <h3 className="font-semibold text-blue-800 text-sm mb-2">DA evaluation as a diagnostic tool</h3>
            <p className="text-xs text-blue-700">
              A model whose DA metrics jump dramatically relative to its standard metrics was being
              penalised for appropriate conservatism — the fix is to adopt the DA framework, or
              fine-tune the model on the deferred cases. A model whose DA metrics barely move has
              genuine confident errors — retrain, re-prompt, or replace. The gap between frameworks
              tells you what kind of problem you have.
            </p>
          </div>
        </section>

        {/* Paper link */}
        <section className="mb-12">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-600 mb-3">
              Full methodology, formal metric definitions, related work analysis,
              and generalisation to clinical decision support, legal review,
              safety-critical engineering, and financial audit.
            </p>
            <a
              href={PAPER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Read the Full Paper
            </a>
            <p className="text-xs text-slate-400 mt-3">
              Yuyu Shen, Hopperlace Research. March 2026. CC BY 4.0.
            </p>
          </div>
        </section>

      </div>

      <Footer />
    </div>
  )
}
