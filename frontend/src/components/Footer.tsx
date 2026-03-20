import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left: branding + contact */}
          <div className="space-y-2">
            <p className="text-sm text-slate-600 font-medium">AI Evidence Synthesis</p>
            <p className="text-xs text-slate-400">
              A product of{' '}
              <a
                href="https://kallidao.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-slate-700 underline"
              >
                KalliDao
              </a>
            </p>
            <a
              href="mailto:hello@kallidao.com"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Mail className="w-3 h-3" />
              hello@kallidao.com
            </a>
          </div>

          {/* Right: nav links */}
          <div className="flex gap-6 text-xs text-slate-400">
            <Link to="/about" className="hover:text-slate-600">About</Link>
            <Link to="/evaluation" className="hover:text-slate-600">Evaluation</Link>
            <a
              href="mailto:hello@kallidao.com"
              className="hover:text-slate-600"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
