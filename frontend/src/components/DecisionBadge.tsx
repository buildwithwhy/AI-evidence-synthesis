import { CheckCircle, XCircle, HelpCircle } from 'lucide-react'

interface Props {
  decision: string
  size?: 'sm' | 'lg'
}

export default function DecisionBadge({ decision, size = 'sm' }: Props) {
  const config = {
    INCLUDE: { bg: 'bg-green-600', text: 'text-white', icon: CheckCircle, label: 'INCLUDE' },
    EXCLUDE: { bg: 'bg-red-600', text: 'text-white', icon: XCircle, label: 'EXCLUDE' },
    UNCLEAR: { bg: 'bg-amber-500', text: 'text-white', icon: HelpCircle, label: 'UNCLEAR' },
  }[decision] ?? { bg: 'bg-gray-400', text: 'text-white', icon: HelpCircle, label: decision }

  const Icon = config.icon

  if (size === 'lg') {
    return (
      <div className={`${config.bg} ${config.text} rounded-lg px-6 py-4 text-center`}>
        <div className="flex items-center justify-center gap-3">
          <Icon className="w-8 h-8" />
          <span className="text-2xl font-bold">{config.label}</span>
        </div>
      </div>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  )
}
