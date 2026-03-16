import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../api/supabase'
import client from '../api/client'
import FileUpload from '../components/FileUpload'
import { AlertCircle } from 'lucide-react'
import type { PicoData } from '../types'

export default function ProtocolPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [pico, setPico] = useState<PicoData>({ P: '', I: '', C: '', O: '', S: '', E: '' })
  const [pasteText, setPasteText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [inputMode, setInputMode] = useState<'paste' | 'upload'>('paste')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProtocol()
  }, [projectId])

  const loadProtocol = async () => {
    const { data } = await supabase
      .from('projects')
      .select('pico_data')
      .eq('id', projectId)
      .single()
    if (data?.pico_data && Object.values(data.pico_data).some((v) => v)) {
      setPico(data.pico_data as PicoData)
    }
  }

  const handleExtract = async () => {
    setExtracting(true)
    setError(null)
    try {
      const formData = new FormData()
      if (inputMode === 'upload' && uploadFile) {
        formData.append('file', uploadFile)
      } else {
        formData.append('text', pasteText)
      }
      const { data } = await client.post('/api/pico/extract', formData)
      setPico({
        P: data.P || '',
        I: data.I || '',
        C: data.C || '',
        O: data.O || '',
        S: data.S || '',
        E: data.E || '',
      })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to extract PICO criteria')
    }
    setExtracting(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { error: saveErr } = await supabase
      .from('projects')
      .update({ pico_data: pico })
      .eq('id', projectId)

    if (saveErr) {
      setError('Failed to save protocol. Please try again.')
      setSaving(false)
      return
    }

    setSaving(false)
    navigate(`/projects/${projectId}`)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Protocol Configuration</h1>
      <p className="text-slate-500 text-sm mb-8">Define the PICO criteria for your review</p>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Import */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Import from Source</h2>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setInputMode('paste')}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                inputMode === 'paste' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Paste Text
            </button>
            <button
              onClick={() => setInputMode('upload')}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                inputMode === 'upload' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Upload File
            </button>
          </div>

          {inputMode === 'paste' ? (
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your protocol text here..."
              className="w-full h-64 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          ) : (
            <FileUpload
              accept=".pdf,.txt"
              onFiles={(files) => setUploadFile(files[0])}
              label="Upload protocol document (PDF or TXT)"
            />
          )}

          <button
            onClick={handleExtract}
            disabled={extracting || (inputMode === 'paste' ? !pasteText : !uploadFile)}
            className="mt-4 w-full bg-slate-800 text-white py-2.5 rounded-md text-sm font-medium hover:bg-slate-900 disabled:opacity-50 transition-colors"
          >
            {extracting ? 'Analyzing...' : 'Auto-Extract Criteria'}
          </button>
        </div>

        {/* Right: PICO Form */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Edit Criteria</h2>

          <form onSubmit={handleSave} className="space-y-4">
            {[
              { key: 'P', label: 'Population' },
              { key: 'I', label: 'Intervention' },
              { key: 'C', label: 'Comparator' },
              { key: 'O', label: 'Outcome' },
              { key: 'S', label: 'Study Design' },
              { key: 'E', label: 'Exclusion Criteria' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <textarea
                  value={pico[key as keyof PicoData]}
                  onChange={(e) => setPico({ ...pico, [key]: e.target.value })}
                  rows={key === 'S' ? 1 : 2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
