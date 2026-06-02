import { forwardRef } from 'react'
import ResultCard from './ResultCard'
import ProductRecommend from './ProductRecommend'

interface ResultSectionProps {
  loading: boolean
  resultText: string
  hasResult: boolean
  originalText: string
  onCopyResult: () => void
  onContinueOptimize: () => void
  onMoreAcademic: () => void
}

const ResultSection = forwardRef<HTMLDivElement, ResultSectionProps>(function ResultSection({
  loading, resultText, hasResult, originalText,
  onCopyResult, onContinueOptimize, onMoreAcademic,
}, ref) {
  // 加载状态
  if (loading && !hasResult) {
    return (
      <div ref={ref} className="mt-6 animate-fade-in-up" style={{ scrollMarginTop: '80px' }}>
        <h2 className="mb-4 text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200">📋 降重结果</h2>
        <div className="rounded-2xl border border-indigo-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="flex flex-col items-center justify-center py-10">
            <span className="mb-4 h-10 w-10 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600" />
            <p className="text-sm text-gray-400 dark:text-gray-500">AI 正在处理，请稍候...</p>
          </div>
        </div>
      </div>
    )
  }

  // 空状态（无结果且未加载）
  if (!hasResult && !loading) {
    return (
      <div ref={ref} className="mt-6" style={{ scrollMarginTop: '80px' }}>
        <h2 className="mb-4 text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200">📋 降重结果</h2>
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 shadow-sm">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="mb-3 text-3xl text-gray-300 dark:text-gray-600">📄</span>
            <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">
              处理完成后，将显示降重后文本、修改说明，并支持一键复制。
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 有结果
  return (
    <div ref={ref} className="mt-6 animate-fade-in-up" style={{ scrollMarginTop: '80px' }}>
      <h2 className="mb-4 text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200">📋 降重结果</h2>
      <div className="rounded-2xl border border-indigo-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6 shadow-sm">
        {/* 结果显示 */}
        <div className="mb-5">
          <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 p-4 sm:p-5">
            <h3 className="mb-3 text-sm font-medium text-indigo-600 dark:text-indigo-400">✅ 降重后的文本</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-200">
              {resultText}
            </p>
          </div>
        </div>

        {/* 字数对比 */}
        <div className="mb-5 flex flex-wrap gap-4 text-xs text-gray-400 dark:text-gray-500">
          <span>原文字数：<strong className="text-gray-600 dark:text-gray-300">{originalText.length}</strong></span>
          <span>结果字数：<strong className="text-gray-600 dark:text-gray-300">{resultText.length}</strong></span>
          <span>变化：<strong className={resultText.length !== originalText.length ? 'text-indigo-500' : 'text-gray-400'}>
            {resultText.length - originalText.length > 0 ? '+' : ''}{resultText.length - originalText.length}
          </strong></span>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={onCopyResult}
            className="flex-1 min-w-[100px] cursor-pointer rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 transition-all hover:shadow-lg active:scale-[0.98]"
          >
            📋 复制结果
          </button>
          <button
            onClick={onContinueOptimize}
            className="flex-1 min-w-[100px] cursor-pointer rounded-xl border border-indigo-200 dark:border-gray-600 px-4 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 transition-all hover:bg-indigo-50 dark:hover:bg-gray-700 active:scale-[0.98]"
          >
            🔄 继续降重
          </button>
          <button
            onClick={onMoreAcademic}
            className="flex-1 min-w-[100px] cursor-pointer rounded-xl border border-purple-200 dark:border-purple-800 px-4 py-2.5 text-sm font-medium text-purple-600 dark:text-purple-400 transition-all hover:bg-purple-50 dark:hover:bg-gray-700 active:scale-[0.98]"
          >
            🎓 转为更学术
          </button>
        </div>

        {/* 底部提示 */}
        <p className="mt-4 text-center text-xs text-gray-300 dark:text-gray-600">
          💡 点击「继续降重」可将结果填回输入框再次优化；「转为更学术」将提升表达的专业性
        </p>
      </div>

      {/* 商品推荐区（保持不变） */}
      {hasResult && (
        <div className="mt-5">
          <ProductRecommend product="" features="" />
        </div>
      )}
    </div>
  )
})

export default ResultSection
