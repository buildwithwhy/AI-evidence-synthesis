import { Link } from 'react-router-dom'
import PublicNav from '../components/PublicNav'
import { Shield, Eye, Users, BarChart3, FileSearch, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold text-slate-900 leading-tight">
            AI-Powered Evidence Synthesis
            <span className="block text-blue-600 mt-1">with Full Auditability</span>
          </h1>
          <p className="text-lg text-slate-600 mt-6 leading-relaxed">
            Accelerate systematic reviews without sacrificing rigour. Our dual-run
            consensus screening catches what single-pass AI misses, and every decision
            comes with a complete audit trail — from the original AI reasoning to
            every human override.
          </p>
          <div className="flex gap-4 mt-8">
            <Link
              to="/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/about"
              className="bg-white text-slate-700 px-6 py-3 rounded-md text-sm font-medium border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Learn More
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

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-slate-800 mb-10">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: FileSearch,
              title: 'Two-Stage Screening',
              desc: 'Level 1 abstract screening and Level 2 full-text review, mirroring the standard systematic review workflow.',
            },
            {
              icon: Zap,
              title: 'Dual-Run Consensus',
              desc: 'Each study is screened twice. Only when both runs agree with high confidence is the decision accepted. Disagreements are flagged for human review.',
            },
            {
              icon: BarChart3,
              title: 'Analytics Dashboard',
              desc: 'Track inclusion rates, override patterns, confidence distributions, and source breakdowns across your review.',
            },
            {
              icon: Shield,
              title: 'Complete Audit Trail',
              desc: 'Every decision, override, and reasoning chain is permanently recorded with timestamps and user attribution.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-5 bg-slate-50 rounded-lg border border-slate-100">
              <div className="p-2 bg-white rounded-lg h-fit border border-slate-200">
                <Icon className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
                <p className="text-sm text-slate-600">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to accelerate your systematic review?</h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Start screening studies in minutes. Free to try, no credit card required.
          </p>
          <Link
            to="/login"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Create Free Account
          </Link>
        </div>
      </section>

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
