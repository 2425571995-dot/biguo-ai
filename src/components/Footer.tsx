import { DAILY_LIMIT } from '../constants'
import { getVisitCount, getGenCount } from '../utils/storage'

export default function Footer() {
  return (
    <footer className="border-t border-indigo-100 dark:border-gray-700 py-6 text-center">
      <div className="mx-auto px-6 space-y-2">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          📖 毕过AI · 专注毕业论文降重、润色与提交前检查
        </p>
        <div className="text-xs text-gray-300 dark:text-gray-600 space-x-3">
          <span>
            访问人数 <strong className="text-indigo-400">{getVisitCount()}</strong>
          </span>
          <span>·</span>
          <span>
            已服务 <strong className="text-indigo-400">{getGenCount()}</strong> 篇论文
          </span>
          <span>·</span>
          <span>每日免费 {DAILY_LIMIT} 次</span>
        </div>
      </div>
    </footer>
  )
}
