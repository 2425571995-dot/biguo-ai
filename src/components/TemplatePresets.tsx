import { useState } from 'react'
import { FEATURE_BUTTONS, REVIEW_ITEMS } from '../constants'

interface TemplatePresetsProps {
  activeFeature: string
  onFeatureChange: (key: string) => void
}

export default function TemplatePresets({ activeFeature, onFeatureChange }: TemplatePresetsProps) {
  return (
    <div className="mb-5 space-y-4">
      {/* 第一排：主功能按钮（降重/润色/改写/翻译/扩写） */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {FEATURE_BUTTONS.map((btn) => {
          const isActive = activeFeature === btn.key
          return (
            <button
              key={btn.key}
              onClick={() => onFeatureChange(btn.key)}
              className={`cursor-pointer rounded-lg px-4 sm:px-5 py-2 text-sm sm:text-base font-medium transition-all active:scale-95 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/30'
                  : 'border border-indigo-200 dark:border-gray-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700'
              }`}
            >
              {btn.label}
            </button>
          )
        })}
      </div>

      {/* 第二排：提交前检查区 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide uppercase">提交前检查</span>
          <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700" />
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {REVIEW_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => {}}
              className="cursor-pointer rounded-md border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 transition-colors hover:border-indigo-200 hover:text-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-gray-700 active:scale-95"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
