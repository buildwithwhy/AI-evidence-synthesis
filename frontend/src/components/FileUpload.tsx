import { useRef, useState, DragEvent } from 'react'
import { Upload, FileText } from 'lucide-react'

interface Props {
  accept?: string
  multiple?: boolean
  onFiles: (files: File[]) => void
  label?: string
}

export default function FileUpload({ accept, multiple, onFiles, label }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [fileNames, setFileNames] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files)
    setFileNames(arr.map((f) => f.name))
    onFiles(arr)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {fileNames.length > 0 ? (
        <div className="space-y-1">
          {fileNames.map((name) => (
            <div key={name} className="flex items-center justify-center gap-2 text-sm text-slate-600">
              <FileText className="w-4 h-4" />
              {name}
            </div>
          ))}
        </div>
      ) : (
        <div>
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">{label || 'Drop files here or click to browse'}</p>
        </div>
      )}
    </div>
  )
}
