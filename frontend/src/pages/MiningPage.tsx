import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../api/supabase'
import client from '../api/client'
import FileUpload from '../components/FileUpload'
import { Check, ChevronDown } from 'lucide-react'
import type { PicoData, Citation } from '../types'

export default function MiningPage() {
  const { projectId } = useParams()
  const [pico, setPico] = useState<PicoData>({ P: '', I: '', C: '', O: '', S: '', E: '' })
  const [file, setFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [citations, setCitations] = useState<Citation[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)

  useEffect(() => {
    loadPico()
  }, [projectId])

  const loadPico = async () => {
    const { data } = await supabase
      .from('projects')
      .select('pico_data')
      .eq('id', projectId)
      .single()
    if (data?.pico_data) setPico(data.pico_data as PicoData)
  }

  const handleExtract = async () => {
    if (!file) return
    setExtracting(true)
    setCitations([])
    setSelected(new Set())
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('pico_p', pico.P)
      formData.append('pico_i', pico.I)
      formData.append('pico_c', pico.C)
      formData.append('pico_o', pico.O)
      formData.append('pico_s', pico.S)
      formData.append('pico_e', pico.E)

      const { data } = await client.post('/api/mining/extract', formData)
      setCitations(data.citations)

      // Auto-select relevant ones
      const autoSelected = new Set<number>()
      data.citations.forEach((c: Citation, i: number) => {
        if (c.IsRelevant) autoSelected.add(i)
      })
      setSelected(autoSelected)
    } catch (err) {
      console.error('Mining failed:', err)
    }
    setExtracting(false)
  }

  const toggleSelection = (idx: number) => {
    const newSet = new Set(selected)
    if (newSet.has(idx)) newSet.delete(idx)
    else newSet.add(idx)
    setSelected(newSet)
  }

  const handleImport = async () => {
    setImporting(true)
    let count = 0

    for (const idx of selected) {
      const c = citations[idx]
      const { error } = await supabase.from('screening_results').insert({
        project_id: projectId,
        level: 2,
        title: c.Title,
        abstract: `AUTHOR: ${c.AuthorYear}\nCONTEXT: ${c.Context}\nREASON: ${c.Reason}`,
        decision: 'INCLUDE',
        reason: c.Reason,
        confidence: c.Confidence,
        p_check: true, i_check: true, c_check: true,
        o_check: true, s_check: true, e_check: false,
        p_reas: '', i_reas: '', c_reas: '',
        o_reas: '', s_reas: '', e_reas: '',
        source: `Mined: ${file?.name || 'Unknown'}`,
        override_history: '',
      })
      if (!error) count++
    }

    setImportResult(`Imported ${count} studies`)
    setImporting(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Meta-Miner</h1>
      <p className="text-slate-500 text-sm mb-8">
        Extract citations from systematic reviews for Level 2 screening
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Upload */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Upload Systematic Review</h2>
            <FileUpload
              accept=".pdf"
              onFiles={(files) => setFile(files[0])}
              label="Upload systematic review PDF"
            />
            <button
              onClick={handleExtract}
              disabled={!file || extracting}
              className="mt-4 w-full bg-blue-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {extracting ? 'Extracting citations...' : 'Extract Citations'}
            </button>
          </div>
        </div>

        {/* Right: Results */}
        <div>
          {extracting && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Mining citations...</p>
              </div>
            </div>
          )}

          {citations.length > 0 && !extracting && (
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">
                  Found {citations.length} Citations
                </h2>
                <span className="text-sm text-slate-500">{selected.size} selected</span>
              </div>

              <div className="max-h-[500px] overflow-y-auto space-y-2 mb-4">
                {citations.map((c, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleSelection(idx)}
                    className={`p-3 rounded-md border cursor-pointer transition-colors ${
                      selected.has(idx)
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                        selected.has(idx) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                      }`}>
                        {selected.has(idx) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700">{c.AuthorYear} - {c.Title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-400">
                            Confidence: {c.Confidence}%
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            c.IsRelevant
                              ? 'bg-green-50 text-green-600'
                              : 'bg-slate-50 text-slate-400'
                          }`}>
                            {c.Context}
                          </span>
                        </div>
                        <details className="mt-1 group">
                          <summary className="text-xs text-slate-400 cursor-pointer flex items-center gap-1">
                            <ChevronDown className="w-3 h-3 group-open:rotate-180" />
                            Reason
                          </summary>
                          <p className="text-xs text-slate-500 mt-1">{c.Reason}</p>
                        </details>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleImport}
                disabled={selected.size === 0 || importing}
                className="w-full bg-blue-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {importing ? 'Importing...' : `Import ${selected.size} Selected Studies`}
              </button>

              {importResult && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                  {importResult}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
