import { SAMPLE_THESIS_TEXT, OUTPUT_STYLE, INTENSITY_OPTIONS } from '../constants'
import type { Intensity } from '../types'

interface InputFormProps {
  inputText: string
  intensity: Intensity
  loading: boolean
  onInputChange: (v: string) => void
  onIntensityChange: (v: Intensity) => void
  onGenerate: () => void
  onPasteExample: () => void
}

const MAX_CHARS = 2000

export default function InputForm({
  inputText, intensity, loading,
  onInputChange, onIntensityChange, onGenerate, onPasteExample,
}: InputFormProps) {
  const charCount = inputText.length
  const isOverLimit = charCount > MAX_CHARS
  const inputCls = 'w-full rounded-xl border border-indigo-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none transition-all'

  return (
    <div className="rounded-2xl border border-indigo-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6 shadow-sm">
      {/* 标题行 + 粘贴示例 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200">
          📝 输入论文段落
        </h2>
        <button
          onClick={onPasteExample}
          className="cursor-pointer rounded-lg border border-indigo-200 dark:border-gray-600 px-3 py-1 text-xs text-indigo-600 dark:text-indigo-400 transition-colors hover:bg-indigo-50 dark:hover:bg-gray-700 active:scale-95"
        >
          📋 粘贴示例
        </button>
      </div>

      {/* 输入框 */}
      <textarea
        rows={6}
        placeholder={`粘贴需要降重的论文段落，建议 100–800 字。

AI 将在保留原意的基础上调整句式、替换重复表达，并优化为更自然的学术表达。`}
        value={inputText}
        onChange={(e) => onInputChange(e.target.value)}
        className={`${inputCls} resize-none ${isOverLimit ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
      />

      {/* 字数统计 */}
      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span className={`${isOverLimit ? 'text-red-500 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
          {charCount} / {MAX_CHARS} 字，建议 100–800 字
        </span>
        {isOverLimit && (
          <span className="text-red-500">⚠️ 内容过长，建议分段处理，效果更稳定</span>
        )}
      </div>

      {/* 降重强度 */}
      <div className="mt-4">
        <label className="mb-2 block text-sm text-gray-500 dark:text-gray-400">降重强度</label>
        <div className="inline-flex rounded-lg border border-indigo-200 dark:border-gray-600 overflow-hidden">
          {INTENSITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onIntensityChange(opt.value as Intensity)}
              className={`cursor-pointer px-4 py-1.5 text-sm font-medium transition-all ${
                intensity === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-gray-700'
              } ${opt.value !== INTENSITY_OPTIONS[0].value ? 'border-l border-indigo-200 dark:border-gray-600' : ''}`}
              title={opt.desc}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 输出风格 */}
      <div className="mt-3">
        <label className="text-sm text-gray-400 dark:text-gray-500">
          输出风格：<span className="font-medium text-gray-600 dark:text-gray-300">{OUTPUT_STYLE}</span>
        </label>
      </div>

      {/* 主按钮 */}
      <div className="mt-5">
        <button
          onClick={onGenerate}
          disabled={loading || isOverLimit}
          className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3.5 text-base sm:text-lg font-semibold text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-all hover:shadow-xl hover:shadow-indigo-300 dark:hover:shadow-indigo-900/50 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              AI 正在处理...
            </span>
          ) : (
            '🚀 开始智能降重，保留原意'
          )}
        </button>
        <p className="mt-1.5 text-center text-xs text-gray-400 dark:text-gray-500">预计 10–20 秒生成结果</p>
      </div>

      {/* 隐私提示 */}
      <p className="mt-3 text-center text-[11px] text-gray-300 dark:text-gray-600">
        🔒 请勿输入涉密内容，文本仅用于本次处理展示
      </p>
    </div>
  )
}
