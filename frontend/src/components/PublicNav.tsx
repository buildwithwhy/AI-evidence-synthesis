import { Link, useLocation } from 'react-router-dom'
import { Beaker } from 'lucide-react'

export default function PublicNav() {
  const location = useLocation()

  const linkClass = (path: string) =>
    `text-sm font-medium transition-colors ${
      location.pathname === path
        ? 'text-slate-900'
        : 'text-slate-500 hover:text-slate-700'
    }`

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Beaker className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-slate-800 text-sm">AI Evidence Synthesis</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/about" className={linkClass('/about')}>About</Link>
          <Link to="/evaluation" className={linkClass('/evaluation')}>Evaluation</Link>
          <Link
            to="/login"
            className="text-sm font-medium bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  )
}
