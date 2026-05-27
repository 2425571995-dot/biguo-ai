import type { Post, SensitiveWord } from '../types'

interface ResultCardProps {
  post: Post
  formattingId: number | null
  sensitiveResult?: SensitiveWord[]
  onCopy: (post: Post) => void
  onFormat: (post: Post) => void
  onCheckSensitive: (post: Post) => void
  onShareWechat: (post: Post) => void
  onShareWeibo: (post: Post) => void
}

export default function ResultCard({
  post, formattingId, sensitiveResult,
  onCopy, onFormat, onCheckSensitive, onShareWechat, onShareWeibo,
}: ResultCardProps) {
  return (
    <div className="group rounded-2xl border border-pink-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm transition-all hover:shadow-md flex flex-col">
      <h3 className="mb-2 font-semibold text-gray-800 dark:text-gray-100">{post.title}</h3>
      <div className="relative flex-1 overflow-y-auto max-h-[300px] pr-1">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-gray-300">{post.content}</p>
        <span className="absolute bottom-0 right-1 text-[10px] text-gray-400 dark:text-gray-500">{post.content.length} 字</span>
      </div>
      <div className="mb-3 flex flex-wrap gap-1 mt-2">
        {post.tags.map((tag, i) => (
          <span key={i} className="rounded-full bg-pink-50 dark:bg-pink-900/30 px-2.5 py-0.5 text-xs text-pink-500">
            {tag}
          </span>
        ))}
      </div>

      {sensitiveResult !== undefined && (
        <div className={`mb-3 rounded-lg p-2.5 text-xs ${
          sensitiveResult.length > 0
            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
            : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
        }`}>
          {sensitiveResult.length > 0 ? (
            <div>
              ⚠️ 发现 {sensitiveResult.length} 个敏感词：
              <div className="mt-1 flex flex-wrap gap-1.5">
                {sensitiveResult.map((f, i) => (
                  <span key={i} className="inline-block rounded bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5" title={f.tip}>
                    {f.word}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            '✅ 未发现敏感词，内容安全'
          )}
        </div>
      )}

      <div className="flex gap-1.5">
        <button
          onClick={() => onCopy(post)}
          className="flex-1 cursor-pointer rounded-lg border border-pink-200 dark:border-gray-600 py-1.5 text-xs text-pink-600 dark:text-pink-400 transition-all hover:bg-pink-50 dark:hover:bg-gray-700 active:scale-95"
        >
          📋 复制
        </button>
        <button
          onClick={() => onFormat(post)}
          disabled={formattingId === post.id}
          className="flex-1 cursor-pointer rounded-lg border border-purple-200 dark:border-purple-800 py-1.5 text-xs text-purple-600 dark:text-purple-400 transition-all hover:bg-purple-50 dark:hover:bg-gray-700 active:scale-95 disabled:opacity-50"
        >
          {formattingId === post.id ? '⏳ 优化中' : '🎨 优化'}
        </button>
        <button
          onClick={() => onCheckSensitive(post)}
          className="flex-1 cursor-pointer rounded-lg border border-amber-200 dark:border-amber-800 py-1.5 text-xs text-amber-600 dark:text-amber-400 transition-all hover:bg-amber-50 dark:hover:bg-gray-700 active:scale-95"
        >
          🔍 敏感词
        </button>
      </div>

      <div className="mt-1.5 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <span>分享到</span>
        <button onClick={() => onShareWechat(post)} className="cursor-pointer text-green-500 hover:text-green-600 transition-colors">💬 微信</button>
        <span className="text-gray-300 dark:text-gray-600">·</span>
        <button onClick={() => onShareWeibo(post)} className="cursor-pointer text-red-400 hover:text-red-500 transition-colors">📢 微博</button>
      </div>
    </div>
  )
}
