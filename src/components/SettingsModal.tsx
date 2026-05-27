interface SettingsModalProps {
  apiKey: string
  verifying: boolean
  onSaveKey: (key: string) => void
  onVerify: () => void
  onClose: () => void
}

export default function SettingsModal({ apiKey, verifying, onSaveKey, onVerify, onClose }: SettingsModalProps) {
  const inputCls = 'w-full rounded-xl border border-pink-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition-all'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="animate-modal mx-4 w-full max-w-md rounded-2xl border border-pink-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">⚙️ API 设置</h2>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
          输入你的 DeepSeek API Key 即可开始使用。密钥仅保存在你浏览器本地。
        </p>
        <div className="mb-3 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 p-3 text-left">
          <p className="text-xs font-medium text-pink-700 dark:text-pink-400 mb-1">📋 如何免费获取 API Key？</p>
          <ol className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5 list-decimal list-inside">
            <li>点击下方「免费获取」按钮，前往 DeepSeek 官网</li>
            <li>注册/登录后，进入「API Keys」页面</li>
            <li>点击「创建 API Key」，复制以 sk- 开头的密钥</li>
            <li>新用户送 500 万 tokens（足够生成数千条文案）</li>
          </ol>
        </div>

        <input
          type="password"
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => onSaveKey(e.target.value)}
          className={inputCls + ' mb-3'}
        />

        <div className="flex gap-2">
          <button
            onClick={onVerify}
            disabled={verifying}
            className="cursor-pointer rounded-xl border border-pink-200 dark:border-gray-600 px-4 py-2.5 text-sm text-pink-600 dark:text-pink-400 transition-colors hover:bg-pink-50 dark:hover:bg-gray-700 disabled:opacity-50 flex-1"
          >
            {verifying ? '验证中...' : '🔍 验证 Key'}
          </button>
          <a
            href="https://platform.deepseek.com/api_keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-pink-200 dark:border-gray-600 px-4 py-2.5 text-sm text-pink-600 dark:text-pink-400 transition-colors hover:bg-pink-50 dark:hover:bg-gray-700"
          >
            🔑 免费获取
          </a>
        </div>

        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          新用户注册 DeepSeek 送 500 万 tokens，足够生成数千条文案。
        </p>
      </div>
    </div>
  )
}
