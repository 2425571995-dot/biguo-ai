import { DAILY_LIMIT } from '../constants'

interface UpgradeModalProps {
  onContinue: () => void
  onReset: () => void
  onClose: () => void
}

export default function UpgradeModal({ onContinue, onReset, onClose }: UpgradeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="animate-modal mx-4 w-full max-w-sm rounded-2xl border border-pink-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
        <div className="mb-3 text-4xl">👑</div>
        <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100">今日免费次数已用尽</h2>
        <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
          每日免费 <strong className="text-pink-500">{DAILY_LIMIT} 次</strong>，升级后解锁全部权益
        </p>

        <div className="my-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 text-left space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="text-green-500">✅</span> 无限生成次数
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="text-green-500">✅</span> 全部文案风格（种草/测评/避雷/极简）
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="text-green-500">✅</span> AI 智能排版 + 违禁词检测
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="text-green-500">✅</span> 历史记录云端同步
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-pink-50 dark:bg-pink-900/20 p-4">
          <p className="text-sm font-medium text-pink-700 dark:text-pink-400">联系开发者开通会员</p>
          <p className="mt-1 text-sm text-pink-600 dark:text-pink-400">微信: ZzzzySovo</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onContinue}
            className="flex-1 cursor-pointer rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm text-pink-600 dark:text-pink-400 transition-colors hover:bg-pink-50 dark:hover:bg-gray-700"
          >
            继续生成
          </button>
          <button
            onClick={onReset}
            className="flex-1 cursor-pointer rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm text-white shadow-lg shadow-pink-200 dark:shadow-pink-900/30 transition-all hover:shadow-xl"
          >
            重置次数
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          重置后今日可继续免费使用 {DAILY_LIMIT} 次
        </p>
      </div>
    </div>
  )
}
