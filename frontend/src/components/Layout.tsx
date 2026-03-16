import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  FolderOpen,
  LayoutDashboard,
  FileSearch,
  ClipboardList,
  BarChart3,
  Pickaxe,
  Settings,
  LogOut,
  Beaker,
} from 'lucide-react'

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { projectId } = useParams()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-slate-100 text-slate-900'
        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
    }`

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Beaker className="w-6 h-6 text-blue-600" />
            <span className="font-semibold text-slate-800 text-sm">AI Evidence Synthesis</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink to="/projects" className={linkClass}>
            <FolderOpen className="w-4 h-4" />
            Projects
          </NavLink>

          {projectId && (
            <>
              <div className="pt-4 pb-2 px-3">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Current Project
                </p>
              </div>
              <NavLink to={`/projects/${projectId}`} end className={linkClass}>
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </NavLink>
              <NavLink to={`/projects/${projectId}/protocol`} className={linkClass}>
                <Settings className="w-4 h-4" />
                Protocol
              </NavLink>
              <NavLink to={`/projects/${projectId}/screening`} className={linkClass}>
                <FileSearch className="w-4 h-4" />
                Screening
              </NavLink>
              <NavLink to={`/projects/${projectId}/results`} className={linkClass}>
                <ClipboardList className="w-4 h-4" />
                Results
              </NavLink>
              <NavLink to={`/projects/${projectId}/analytics`} className={linkClass}>
                <BarChart3 className="w-4 h-4" />
                Analytics
              </NavLink>
              <NavLink to={`/projects/${projectId}/mining`} className={linkClass}>
                <Pickaxe className="w-4 h-4" />
                Meta-Miner
              </NavLink>
            </>
          )}
        </nav>

        {/* User */}
        <div className="border-t border-slate-100 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 truncate">{user?.email}</span>
            <button onClick={handleSignOut} className="p-1.5 text-slate-400 hover:text-slate-600 rounded">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
