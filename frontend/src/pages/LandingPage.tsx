import { Link } from 'react-router-dom'
import PublicNav from '../components/PublicNav'
import Footer from '../components/Footer'
import { Shield, Eye, Users, BarChart3, FileSearch, Zap, MessageSquare, Brain, ShieldCheck } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold text-slate-900 leading-tight">
            AI Screening Built for
            <span className="block text-blue-600 mt-1">Where Reviews Silently Break</span>
          </h1>
          <p className="text-lg text-slate-600 mt-6 leading-relaxed">
            Most AI screening tools focus on making the AI more accurate. We focus on what
            happens when AI and human reviewers disagree — the structural failure mode our
            cross-domain research shows even frontier models cannot eliminate. Mandatory
            override reasoning, AI logic shown at the override moment, and random spot-checks
            on confident AI decisions make contested cases visible instead of hiding them.
          </p>
          <div className="flex gap-4 mt-8">
            <Link
              to="/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/evaluation"
              className="bg-white text-slate-700 px-6 py-3 rounded-md text-sm font-medium border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              See the Research
            </Link>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-800 mb-10">Built on Three Principles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="p-2 bg-blue-50 rounded-lg w-fit mb-4">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Transparency</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every screening decision is explainable. The AI shows its reasoning
                for each PICO criterion — Population, Intervention, Comparator,
                Outcome, Study Design, and Exclusion — so reviewers can verify the logic,
                not just the conclusion.
              </p>
            </div>
            <div>
              <div className="p-2 bg-blue-50 rounded-lg w-fit mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Auditability</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                The original AI decision is permanently recorded. Every human override
                is logged with who changed it, when, and from what to what. The complete
                decision history is exportable for regulatory compliance and peer review.
              </p>
            </div>
            <div>
              <div className="p-2 bg-blue-50 rounded-lg w-fit mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Human Oversight</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                AI assists, humans decide. Our dual-run consensus system flags
                uncertain cases for human review rather than making silent
                judgment calls. When the AI is unsure, it says so.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes This Different */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-slate-800 mb-3">What Makes This Different</h2>
        <p className="text-sm text-slate-500 max-w-2xl mb-10">
          Other screening tools also log decisions, support PICO criteria, and offer dual-reviewer
          workflows. Our differentiation is three specific mechanisms — each motivated by an
          empirically identified failure mode that capability scaling does not fix.
        </p>
        <div className="space-y-5">
          <div className="flex gap-5 p-6 bg-slate-50 rounded-lg border border-slate-100">
            <div className="p-2.5 bg-white rounded-lg h-fit border border-slate-200">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1.5">Mandatory override reasoning</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every reviewer override requires a structured, free-text reason — not optional, not
                skippable. Over the lifetime of a review this becomes a longitudinal signal about
                where the protocol leaves room for interpretation. Most tools log that an override
                happened; we capture <em>why</em>.
              </p>
            </div>
          </div>
          <div className="flex gap-5 p-6 bg-slate-50 rounded-lg border border-slate-100">
            <div className="p-2.5 bg-white rounded-lg h-fit border border-slate-200">
              <Brain className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1.5">AI reasoning surfaced at the override moment</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Before a reviewer can change a decision, the AI's reasoning, confidence, and
                per-criterion checks (Population, Intervention, Comparator, Outcome, Study Design,
                Exclusion) are shown side-by-side with the override choice. This forces engagement
                with the AI's logic rather than reflexive override — a small friction that converts
                disagreements into deliberate decisions.
              </p>
            </div>
          </div>
          <div className="flex gap-5 p-6 bg-slate-50 rounded-lg border border-slate-100">
            <div className="p-2.5 bg-white rounded-lg h-fit border border-slate-200">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1.5">Random spot-check on confident AI decisions</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                A dedicated queue samples high-confidence AI decisions for human re-examination —
                the only mechanism that catches silent failures (cases where the AI is confidently
                wrong and never flags itself). Most tools route only UNCERTAIN cases to humans;
                spot-checking confident-correct AI decisions is what surfaces the structural failure
                class our research documents.
              </p>
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-500 mt-8 max-w-2xl">
          Each of these is the deployment response to a specific empirical finding. The motivation is
          documented on the{' '}
          <Link to="/evaluation" className="text-blue-600 hover:text-blue-800 underline">
            evaluation page
          </Link>
          {' '}— including the cross-domain study showing that even Claude Opus 4.7 recovers only 1 of
          52 structural failures across our test domains.
        </p>
      </section>

      {/* Standard features (smaller, supporting) */}
      <section className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h2 className="text-base font-semibold text-slate-700 mb-5">
            Plus the methodology you expect
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: FileSearch,
                title: 'Two-stage screening',
                desc: 'Level 1 (title/abstract) and Level 2 (full-text), mirroring standard systematic-review workflow.',
              },
              {
                icon: Zap,
                title: 'Dual-run consensus',
                desc: 'Each study screened twice. Agreement = decision accepted; disagreement = flagged for human review.',
              },
              {
                icon: BarChart3,
                title: 'Analytics dashboard',
                desc: 'Inclusion rates, override patterns, confidence distributions, source breakdowns.',
              },
              {
                icon: Shield,
                title: 'Immutable audit trail',
                desc: 'Original AI decision is never modified. Every override is logged with full attribution and timestamp.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-md p-4 border border-slate-200">
                <Icon className="w-4 h-4 text-slate-500 mb-2" />
                <h3 className="text-sm font-semibold text-slate-800 mb-1">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Evaluation highlight */}
      <section className="border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Openly Evaluated, Cross-Domain</h2>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mb-3">
            We benchmark our screening engine across 9 LLM models using published systematic
            review datasets with verified PICO criteria — and we publish the data, scripts, and
            findings. Our deference-aware evaluation framework recognises that an AI correctly
            flagging uncertainty for human review is not an error but the right behaviour.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mb-6">
            The May 2026 cross-domain extension covers <strong>2,729 studies</strong> across
            <strong> 5 medical domains</strong> and <strong>16,374 model decisions</strong>. Three independent
            metrics (CER, AURC, ECE) rank the models identically; the same study identifies a
            structural failure class invisible to confidence thresholding that motivates the
            product features above.
          </p>
          <Link
            to="/evaluation"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
          >
            View full evaluation results and methodology
          </Link>
        </div>
      </section>

      {/* Institutional CTA */}
      <section className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Running a systematic review team?</h2>
            <p className="text-slate-600 text-sm mb-6">
              We're onboarding early institutional pilots. Get tailored model selection
              for your domain, higher screening volumes, and dedicated evaluation
              of AI performance on your review types.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://calendly.com/yuyu-hopperlace/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-slate-900 transition-colors"
              >
                Book a Demo
              </a>
              <a
                href="mailto:hello@hopperlace.ai"
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-md text-sm font-medium border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Or email us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Free CTA */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Try it yourself</h2>
          <p className="text-slate-400 mb-4 max-w-xl mx-auto">
            Start screening studies in minutes. No credit card required.
          </p>
          <p className="text-slate-500 text-sm mb-8">
            Free plan: 20 AI screenings per month.
          </p>
          <Link
            to="/login"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
