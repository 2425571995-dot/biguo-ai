import type { HistoryItem, Post } from '../types'

interface HistoryPanelProps {
  history: HistoryItem[]
  onDelete: (id: string) => void
  onClear: () => void
  onCopyPost: (post: Post) => void
}

export default function HistoryPanel({ history, onDelete, onClear, onCopyPost }: HistoryPanelProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <div className="text-4xl mb-3">📝</div>
        <p>暂无历史记录</p>
        <p className="text-xs mt-1">生成文案后会自动保存到这里</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">📋 历史记录</h2>
        <button
          onClick={onClear}
          className="rounded-lg border border-red-200 dark:border-red-800 px-3 py-1 text-xs text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
        >
          清空历史
        </button>
      </div>
      <div className="space-y-3">
        {history.map((item) => (
          <HistoryItemCard key={item.id} item={item} onDelete={onDelete} onCopyPost={onCopyPost} />
        ))}
      </div>
    </div>
  )
}

function HistoryItemCard({ item, onDelete, onCopyPost }: { item: HistoryItem; onDelete: (id: string) => void; onCopyPost: (post: Post) => void }) {
  return (
    <div className="rounded-xl border border-pink-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.product}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{item.posts.length} 条文案</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">{item.createdAt}</span>
          <button
            onClick={() => onDelete(item.id)}
            className="cursor-pointer text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors"
            title="删除"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        {item.posts.map((post, i) => (
          <div key={i} className="flex items-start gap-2 group">
            <span className="shrink-0 text-xs text-gray-400 mt-0.5">{i + 1}.</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{post.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{post.content}</p>
            </div>
            <button
              onClick={() => onCopyPost(post)}
              className="shrink-0 opacity-0 group-hover:opacity-100 cursor-pointer text-pink-400 hover:text-pink-500 transition-all text-xs"
            >
              📋
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
