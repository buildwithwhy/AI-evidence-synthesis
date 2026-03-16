import { Check, X } from 'lucide-react'

interface Props {
  p: boolean
  i: boolean
  c: boolean
  o: boolean
  s: boolean
  e: boolean // true = exclusion violated (bad)
}

export default function PicoScorecard({ p, i, c, o, s, e }: Props) {
  const criteria = [
    { label: 'Population', pass: p },
    { label: 'Intervention', pass: i },
    { label: 'Comparator', pass: c },
    { label: 'Outcome', pass: o },
    { label: 'Study Design', pass: s },
    { label: 'Excl. Criteria', pass: !e }, // Inverted: e=true means violated
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {criteria.map((item) => (
        <span
          key={item.label}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border ${
            item.pass
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {item.pass ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
          {item.label}
        </span>
      ))}
    </div>
  )
}
