import { useState } from 'react'
import { TEMPLATE_GROUPS } from '../constants'
import type { Template } from '../types'

interface TemplatePresetsProps {
  onSelect: (t: Template) => void
}

export default function TemplatePresets({ onSelect }: TemplatePresetsProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-400 dark:text-gray-500">⚡ 快速填充：</span>
      {TEMPLATE_GROUPS.map((group, gi) => {
        if (gi === 0 || expanded) {
          return (
            <span key={group.label} className="contents">
              {gi > 0 && <span className="text-xs text-gray-300 dark:text-gray-600 mx-1">|</span>}
              {group.items.map((t) => (
                <button
                  key={t.label}
                  onClick={() => onSelect(t)}
                  className="cursor-pointer rounded-full border border-pink-200 dark:border-gray-600 px-3.5 py-1.5 text-sm text-pink-600 dark:text-pink-400 transition-all hover:bg-pink-50 dark:hover:bg-gray-700 hover:border-pink-300 active:scale-95"
                >
                  {t.label}
                </button>
              ))}
            </span>
          )
        }
        return null
      })}
      <button
        onClick={() => setExpanded(!expanded)}
        className="cursor-pointer rounded-full border border-dashed border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs text-gray-400 dark:text-gray-500 transition-all hover:border-pink-300 hover:text-pink-500"
      >
        {expanded ? '收起 ▲' : '更多品类 ▼'}
      </button>
    </div>
  )
}
