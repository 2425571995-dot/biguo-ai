import { STYLE_OPTIONS } from '../constants'

interface StyleSelectorProps {
  value: string
  onChange: (value: string) => void
}

export default function StyleSelector({ value, onChange }: StyleSelectorProps) {
  return (
    <div>
      <label className="mb-2 block text-sm text-gray-500 dark:text-gray-400">🎨 文案风格</label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {STYLE_OPTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => onChange(s.value)}
            className={`cursor-pointer rounded-xl border px-3 py-2.5 text-sm transition-all ${
              value === s.value
                ? 'border-pink-400 dark:border-pink-500 bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 shadow-sm'
                : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-pink-200 dark:hover:border-gray-500 hover:bg-pink-50/50 dark:hover:bg-gray-700/50'
            }`}
          >
            <div className="font-medium">{s.label}</div>
            <div className="mt-0.5 text-xs opacity-70">{s.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
