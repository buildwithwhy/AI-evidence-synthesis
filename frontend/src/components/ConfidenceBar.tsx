interface Props {
  confidence: number
}

export default function ConfidenceBar({ confidence }: Props) {
  const color =
    confidence >= 85 ? 'bg-green-500' :
    confidence >= 50 ? 'bg-amber-500' :
    'bg-red-500'

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-slate-500">AI Confidence</span>
        <span className="text-sm font-semibold text-slate-700">{confidence}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  )
}
