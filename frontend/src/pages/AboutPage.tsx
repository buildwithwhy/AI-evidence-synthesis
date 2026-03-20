import PublicNav from '../components/PublicNav'
import { Link } from 'react-router-dom'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">About AI Evidence Synthesis</h1>

        <div className="prose-slate space-y-8 text-slate-600 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">The Problem</h2>
            <p>
              Systematic reviews are the gold standard of evidence-based medicine. They
              underpin clinical guidelines, drug approvals, and health policy decisions
              worldwide. But they take an enormous amount of time — a typical review
              requires screening thousands of studies, a process that can take months of
              manual work by trained reviewers.
            </p>
            <p className="mt-3">
              AI can dramatically accelerate this process. But in a domain where missing
              a single relevant study can invalidate an entire review, the AI must be
              transparent, auditable, and conservative in its uncertainty. Most existing
              tools treat AI screening as a black box. We built something different.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">Our Approach</h2>
            <p>
              AI Evidence Synthesis is designed around the methodological standards set
              by the Cochrane Collaboration — the world's leading organisation for
              evidence synthesis. Our tool mirrors the dual-reviewer workflow that
              Cochrane requires:
            </p>
            <ul className="mt-3 space-y-2">
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold mt-0.5">1.</span>
                <span>
                  <strong>Dual-run consensus:</strong> Every study is screened twice by
                  the AI with different parameters. Only when both runs agree with high
                  confidence is the decision accepted. Any disagreement or uncertainty
                  is flagged for human review.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold mt-0.5">2.</span>
                <span>
                  <strong>PICO-structured reasoning:</strong> Each decision is broken
                  down into explicit checks against Population, Intervention, Comparator,
                  Outcome, Study Design, and Exclusion criteria — the same framework
                  human reviewers use.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold mt-0.5">3.</span>
                <span>
                  <strong>Immutable audit trail:</strong> The original AI decision is
                  permanently recorded and never modified. Human overrides are logged
                  with full attribution (who, when, from what, to what). The complete
                  history is exportable for peer review and regulatory compliance.
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">Model Transparency</h2>
            <p>
              We believe researchers should know — and choose — which AI model screens
              their studies. Our platform supports multiple LLM providers including
              open-source models (Llama, Mistral, DeepSeek, Qwen) alongside proprietary
              ones (GPT-4o, Claude). We publish our evaluation results openly so you can
              see how each model performs on standardised benchmarks before trusting it
              with your review.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">Who This Is For</h2>
            <p>
              AI Evidence Synthesis is built for systematic review teams, health
              technology assessment agencies, clinical guideline developers, and
              research institutions who need to accelerate their screening process
              without compromising methodological rigour or audit requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">Open Evaluation</h2>
            <p>
              We evaluate our screening engine against published benchmark datasets
              including the SYNERGY dataset (26 systematic reviews, 169,000+ studies)
              and test across multiple LLM models. Our evaluation methodology and
              results are published on our{' '}
              <Link to="/evaluation" className="text-blue-600 hover:text-blue-800 underline">
                Evaluation page
              </Link>.
            </p>
          </section>
        </div>
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
