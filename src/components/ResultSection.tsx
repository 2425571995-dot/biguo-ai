import { forwardRef } from 'react'
import type { Post, SensitiveWord } from '../types'
import ResultCard from './ResultCard'
import SkeletonCard from './SkeletonCard'
import ProductRecommend from './ProductRecommend'

interface ResultSectionProps {
  loading: boolean
  posts: Post[]
  formattingId: number | null
  sensitiveResults: Record<number, SensitiveWord[]>
  showHistory: boolean
  product: string
  features: string
  onCopy: (post: Post) => void
  onFormat: (post: Post) => void
  onCheckSensitive: (post: Post) => void
  onShareWechat: (post: Post) => void
  onShareWeibo: (post: Post) => void
  onCopyAll: () => void
  historyContent: React.ReactNode
}

const ResultSection = forwardRef<HTMLDivElement, ResultSectionProps>(function ResultSection({
  loading, posts, formattingId, sensitiveResults, showHistory,
  product, features,
  onCopy, onFormat, onCheckSensitive, onShareWechat, onShareWeibo, onCopyAll,
  historyContent,
}, ref) {
  if (loading && posts.length === 0) {
    return (
      <div className="mt-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200">📋 AI 正在生成...</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (posts.length === 0 && !showHistory) return null

  return (
    <div ref={ref} className="mt-6" style={{ scrollMarginTop: '80px' }}>
      {showHistory ? (
        historyContent
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">📋 生成结果</h2>
            <button
              onClick={onCopyAll}
              className="rounded-lg border border-pink-200 dark:border-gray-600 px-4 py-1.5 text-sm text-pink-600 dark:text-pink-400 transition-colors hover:bg-pink-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              一键复制全部
            </button>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {posts.map((post) => (
              <ResultCard
                key={post.id}
                post={post}
                formattingId={formattingId}
                sensitiveResult={sensitiveResults[post.id]}
                onCopy={onCopy}
                onFormat={onFormat}
                onCheckSensitive={onCheckSensitive}
                onShareWechat={onShareWechat}
                onShareWeibo={onShareWeibo}
              />
            ))}
          </div>

          {/* 商品推荐卡片区 */}
          {posts.length > 0 && (
            <div className="mt-6">
              <ProductRecommend product={product} features={features} />
            </div>
          )}
        </>
      )}
    </div>
  )
})

export default ResultSection
