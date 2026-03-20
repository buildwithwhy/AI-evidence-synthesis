import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../api/supabase'
import client from '../api/client'
import FileUpload from '../components/FileUpload'
import DecisionBadge from '../components/DecisionBadge'
import PicoScorecard from '../components/PicoScorecard'
import ConfidenceBar from '../components/ConfidenceBar'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import type { PicoData, ScreeningResponse } from '../types'

export default function ScreeningPage() {
  const { projectId } = useParams()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const level = parseInt(searchParams.get('level') || '1')

  const [tab, setTab] = useState<'single' | 'batch'>('single')
  const [pico, setPico] = useState<PicoData>({ P: '', I: '', C: '', O: '', S: '', E: '' })

  // Single screening
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [screening, setScreening] = useState(false)
  const [result, setResult] = useState<ScreeningResponse | null>(null)
  const [lastSavedId, setLastSavedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Batch
  const [batchFiles, setBatchFiles] = useState<File[]>([])
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchProgress, setBatchProgress] = useState(0)
  const [batchTotal, setBatchTotal] = useState(0)
  const [batchDone, setBatchDone] = useState<{ processed: number; failed: number; saveErrors: number } | null>(null)
  const [batchError, setBatchError] = useState<string | null>(null)

  // Reasoning toggle
  const [showReasoning, setShowReasoning] = useState(false)

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

  const saveResultToSupabase = async (r: ScreeningResponse & { title?: string; abstract?: string }, source: string) => {
    const { data, error } = await supabase
      .from('screening_results')
      .insert({
        project_id: projectId,
        level,
        title: r.title || 'Untitled',
        abstract: r.abstract || '',
        decision: r.decision,
        ai_decision: r.decision,
        reason: r.reason,
        confidence: r.confidence,
        p_check: r.p_check, i_check: r.i_check, c_check: r.c_check,
        o_check: r.o_check, s_check: r.s_check, e_check: r.e_check,
        p_reas: r.p_reas, i_reas: r.i_reas, c_reas: r.c_reas,
        o_reas: r.o_reas, s_reas: r.s_reas, e_reas: r.e_reas,
        source,
        override_history: [],
      })
      .select('id')
      .single()
    return { id: data?.id ?? null, error }
  }

  const handleScreen = async () => {
    setScreening(true)
    setResult(null)
    setError(null)
    setLastSavedId(null)
    setShowReasoning(false)

    try {
      const formData = new FormData()
      formData.append('level', String(level))
      formData.append('pico_p', pico.P)
      formData.append('pico_i', pico.I)
      formData.append('pico_c', pico.C)
      formData.append('pico_o', pico.O)
      formData.append('pico_s', pico.S)
      formData.append('pico_e', pico.E)

      if (inputMode === 'upload' && file) {
        formData.append('file', file)
        formData.append('title', file.name)
      } else {
        formData.append('title', title)
        formData.append('text', text)
      }

      const { data } = await client.post('/api/screening/analyze', formData)
      setResult(data)

      // Save to Supabase
      const resultTitle = inputMode === 'upload' && file ? file.name : title || 'Untitled'
      const resultAbstract = inputMode === 'upload' ? '' : text
      const { id, error: saveErr } = await saveResultToSupabase(
        { ...data, title: resultTitle, abstract: resultAbstract },
        'Single'
      )
      if (saveErr) {
        setError('Result was analyzed but could not be saved. Try again.')
      } else {
        setLastSavedId(id)
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Screening failed'
      setError(msg)
    }
    setScreening(false)
  }

  const handleOverride = async (decision: string) => {
    if (!result || !lastSavedId) return

    // Fetch current record to get existing override history
    const { data: current } = await supabase
      .from('screening_results')
      .select('decision, override_history')
      .eq('id', lastSavedId)
      .single()

    const prevHistory = Array.isArray(current?.override_history) ? current.override_history : []
    const newEntry = {
      from: current?.decision || result.decision,
      to: decision,
      by: user?.email || 'unknown',
      at: new Date().toISOString(),
    }

    const { error: updateErr } = await supabase
      .from('screening_results')
      .update({
        decision,
        override_history: [...prevHistory, newEntry],
      })
      .eq('id', lastSavedId)

    if (updateErr) {
      setError('Could not save override. Please try again.')
    } else {
      setResult({ ...result, decision })
      setError(null)
    }
  }

  const handleBatch = async () => {
    setBatchRunning(true)
    setBatchDone(null)
    setBatchError(null)
    setBatchProgress(0)

    try {
      let apiResults: any[]
      let apiFailed: number

      if (level === 1 && batchFiles.length === 1 && batchFiles[0].name.endsWith('.csv')) {
        const formData = new FormData()
        formData.append('file', batchFiles[0])
        formData.append('level', '1')
        formData.append('pico_p', pico.P)
        formData.append('pico_i', pico.I)
        formData.append('pico_c', pico.C)
        formData.append('pico_o', pico.O)
        formData.append('pico_s', pico.S)
        formData.append('pico_e', pico.E)

        const { data } = await client.post('/api/screening/analyze/batch-csv', formData)
        apiResults = data.results
        apiFailed = data.failed
      } else {
        const formData = new FormData()
        formData.append('level', String(level))
        formData.append('pico_p', pico.P)
        formData.append('pico_i', pico.I)
        formData.append('pico_c', pico.C)
        formData.append('pico_o', pico.O)
        formData.append('pico_s', pico.S)
        formData.append('pico_e', pico.E)
        batchFiles.forEach((f) => formData.append('files', f))

        const { data } = await client.post('/api/screening/analyze/batch', formData)
        apiResults = data.results
        apiFailed = data.failed
      }

      // Batch insert to Supabase (single round trip instead of N)
      setBatchTotal(apiResults.length)
      const source = level === 1 ? 'Batch CSV' : 'Batch PDF'

      const rows = apiResults.map((r: any) => ({
        project_id: projectId,
        level,
        title: r.title || 'Untitled',
        abstract: r.abstract || '',
        decision: r.decision,
        ai_decision: r.decision,
        reason: r.reason,
        confidence: r.confidence,
        p_check: r.p_check, i_check: r.i_check, c_check: r.c_check,
        o_check: r.o_check, s_check: r.s_check, e_check: r.e_check,
        p_reas: r.p_reas, i_reas: r.i_reas, c_reas: r.c_reas,
        o_reas: r.o_reas, s_reas: r.s_reas, e_reas: r.e_reas,
        source,
        override_history: [],
      }))

      // Insert in chunks of 500 to avoid payload limits
      let saveErrors = 0
      const chunkSize = 500
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize)
        const { error: saveErr } = await supabase.from('screening_results').insert(chunk)
        if (saveErr) saveErrors += chunk.length
        setBatchProgress(Math.min(i + chunkSize, rows.length))
      }

      setBatchDone({ processed: apiResults.length, failed: apiFailed, saveErrors })
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Batch processing failed'
      setBatchError(msg)
    }
    setBatchRunning(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Level {level} Screening
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {level === 1 ? 'Abstract screening workspace' : 'Full text review workspace'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setTab('single')}
          className={`px-4 pb-3 text-sm font-medium border-b-2 ${
            tab === 'single'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Single Study
        </button>
        <button
          onClick={() => setTab('batch')}
          className={`px-4 pb-3 text-sm font-medium border-b-2 ${
            tab === 'batch'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Batch Processing
        </button>
      </div>

      {tab === 'single' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Input */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setInputMode('upload')}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  inputMode === 'upload' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setInputMode('paste')}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  inputMode === 'paste' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Paste Text
              </button>
            </div>

            {inputMode === 'upload' ? (
              <FileUpload
                accept=".pdf,.txt"
                onFiles={(files) => setFile(files[0])}
                label="Upload PDF or text file"
              />
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Study title"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste abstract or full text..."
                  rows={12}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            )}

            <button
              onClick={handleScreen}
              disabled={screening || (inputMode === 'upload' ? !file : !text)}
              className="mt-4 w-full bg-blue-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {screening ? 'Analyzing...' : 'Run Screening'}
            </button>
          </div>

          {/* Right: Results */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Analysis Result</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {screening && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">AI is analyzing the study...</p>
                </div>
              </div>
            )}

            {result && !screening && (
              <div className="space-y-6">
                <DecisionBadge decision={result.decision} size="lg" />
                <PicoScorecard
                  p={result.p_check}
                  i={result.i_check}
                  c={result.c_check}
                  o={result.o_check}
                  s={result.s_check}
                  e={result.e_check}
                />
                <ConfidenceBar confidence={result.confidence} />

                <div>
                  <button
                    onClick={() => setShowReasoning(!showReasoning)}
                    className="text-sm font-medium text-slate-600 hover:text-slate-800"
                  >
                    {showReasoning ? 'Hide Reasoning' : 'View Reasoning'}
                  </button>
                  {showReasoning && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-md text-sm text-slate-600">
                      {result.reason}
                    </div>
                  )}
                </div>

                {lastSavedId && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Manual Override</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOverride('INCLUDE')}
                        className="flex-1 py-2 rounded-md text-sm font-medium border border-green-200 text-green-700 hover:bg-green-50"
                      >
                        Override: INCLUDE
                      </button>
                      <button
                        onClick={() => handleOverride('EXCLUDE')}
                        className="flex-1 py-2 rounded-md text-sm font-medium border border-red-200 text-red-700 hover:bg-red-50"
                      >
                        Override: EXCLUDE
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!result && !screening && !error && (
              <div className="text-center py-12 text-slate-400">
                <p>Upload a study and run screening to see results</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Batch tab */
        <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Batch Processing</h2>
          <p className="text-sm text-slate-500 mb-4">
            {level === 1
              ? 'Upload a CSV file with Title and Abstract columns'
              : 'Upload multiple PDF files for full-text screening'}
          </p>

          <FileUpload
            accept={level === 1 ? '.csv' : '.pdf'}
            multiple={level === 2}
            onFiles={setBatchFiles}
            label={level === 1 ? 'Upload CSV file' : 'Upload PDF files'}
          />

          {batchFiles.length > 0 && (
            <p className="text-sm text-slate-500 mt-2">
              {batchFiles.length} file{batchFiles.length > 1 ? 's' : ''} selected
            </p>
          )}

          <button
            onClick={handleBatch}
            disabled={batchRunning || batchFiles.length === 0}
            className="mt-4 w-full bg-blue-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {batchRunning ? 'Processing...' : 'Run Batch'}
          </button>

          {batchError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{batchError}</p>
            </div>
          )}

          {batchRunning && (
            <div className="mt-4">
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${batchTotal > 0 ? (batchProgress / batchTotal) * 100 : 0}%` }}
                />
              </div>
              <p className="text-sm text-slate-500 mt-2">
                {batchProgress > 0
                  ? `Saving ${batchProgress} / ${batchTotal} results...`
                  : 'Sending studies to AI for analysis...'}
              </p>
            </div>
          )}

          {batchDone && (
            <div className={`mt-4 p-4 rounded-md border ${
              batchDone.saveErrors > 0
                ? 'bg-amber-50 border-amber-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <p className={`text-sm font-medium ${
                batchDone.saveErrors > 0 ? 'text-amber-700' : 'text-green-700'
              }`}>
                Batch complete: {batchDone.processed} analyzed, {batchDone.failed} failed.
                {batchDone.saveErrors > 0 && ` ${batchDone.saveErrors} could not be saved.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
