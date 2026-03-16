import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../api/supabase'
import { FileSearch, BookOpen, ArrowRight } from 'lucide-react'
import type { Project } from '../types'

export default function ProjectDashboard() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [l1Count, setL1Count] = useState(0)
  const [l2Count, setL2Count] = useState(0)

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    const { data: proj } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()
    setProject(proj)

    const { count: c1 } = await supabase
      .from('screening_results')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('level', 1)
    setL1Count(c1 || 0)

    const { count: c2 } = await supabase
      .from('screening_results')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('level', 2)
    setL2Count(c2 || 0)
  }

  if (!project) {
    return <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
    </div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">{project.name}</h1>
      <p className="text-slate-500 text-sm mb-8">Select a screening level to begin work</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Level 1 */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileSearch className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Level 1: Abstract Screening</h2>
              <p className="text-sm text-slate-500">Title and abstract review</p>
            </div>
          </div>
          <div className="mb-6">
            <div className="text-3xl font-bold text-slate-800">{l1Count}</div>
            <div className="text-sm text-slate-500">studies processed</div>
          </div>
          <button
            onClick={() => navigate(`/projects/${projectId}/screening?level=1`)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Enter Level 1
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Level 2 */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <BookOpen className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Level 2: Full Text Review</h2>
              <p className="text-sm text-slate-500">Comprehensive document analysis</p>
            </div>
          </div>
          <div className="mb-6">
            <div className="text-3xl font-bold text-slate-800">{l2Count}</div>
            <div className="text-sm text-slate-500">studies processed</div>
          </div>
          <button
            onClick={() => navigate(`/projects/${projectId}/screening?level=2`)}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Enter Level 2
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
