import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../api/supabase'
import { useAuth } from '../contexts/AuthContext'
import { FolderPlus, ArrowRight, Calendar } from 'lucide-react'
import type { Project } from '../types'

export default function ProjectsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    const { data, error } = await supabase
      .from('projects')
      .insert({ name: newName.trim(), user_id: user!.id, pico_data: {} })
      .select()
      .single()

    if (!error && data) {
      navigate(`/projects/${data.id}/protocol`)
    }
    setCreating(false)
    setShowNew(false)
    setNewName('')
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
    </div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Project Library</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your systematic review projects</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <FolderPlus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* New project form */}
      {showNew && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
          <form onSubmit={createProject} className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Project name..."
              autoFocus
              className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => { setShowNew(false); setNewName('') }}
              className="px-4 py-2 rounded-md text-sm text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Project grid */}
      {projects.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <FolderPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No projects yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 hover:shadow-sm cursor-pointer transition-all group"
            >
              <h3 className="font-semibold text-slate-800 mb-2">{project.name}</h3>
              <div className="flex items-center gap-1 text-xs text-slate-400 mb-4">
                <Calendar className="w-3 h-3" />
                {new Date(project.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  project.pico_data && Object.values(project.pico_data).some(v => v)
                    ? 'bg-green-50 text-green-600'
                    : 'bg-slate-50 text-slate-400'
                }`}>
                  {project.pico_data && Object.values(project.pico_data).some(v => v)
                    ? 'Protocol set'
                    : 'No protocol'}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
