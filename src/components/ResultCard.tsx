import type { Post } from '../types'

interface ResultCardProps {
  post: Post
  onCopy: (post: Post) => void
}

export default function ResultCard({ post, onCopy }: ResultCardProps) {
  return (
    <div className="group rounded-2xl border border-indigo-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm transition-all hover:shadow-md">
      <div className="relative flex-1 overflow-y-auto max-h-[300px] pr-1">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-gray-300">{post.content}</p>
        <span className="absolute bottom-0 right-1 text-[10px] text-gray-400 dark:text-gray-500">{post.content.length} 字</span>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onCopy(post)}
          className="flex-1 cursor-pointer rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 py-1.5 text-xs font-medium text-white transition-all hover:shadow-md active:scale-95"
        >
          📋 复制
        </button>
      </div>
    </div>
  )
}
