import { DAILY_LIMIT } from '../constants'

interface HeaderProps {
  remaining: number
  dark: boolean
  onToggleDark: () => void
  onOpenSettings: () => void
}

export default function Header({ remaining, dark, onToggleDark, onOpenSettings }: HeaderProps) {
  const quotaColor = remaining > 2
    ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    : remaining > 0
    ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
    : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'

  return (
    <header className="border-b border-indigo-100 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">📖</span>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
              毕过AI · 论文降重助手
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 pl-9">
            保留原意，优化句式，降低重复表达
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className={`rounded-full px-2.5 sm:px-3 py-1 text-xs font-medium ${quotaColor}`}>
            📅 每日免费 <strong>{remaining}</strong>/{DAILY_LIMIT} 次
          </span>
          <button
            onClick={onToggleDark}
            className="cursor-pointer rounded-lg p-1.5 sm:p-2 text-gray-400 dark:text-gray-500 transition-colors hover:bg-indigo-50 dark:hover:bg-gray-800 hover:text-indigo-500"
            title={dark ? '切换亮色' : '切换暗色'}
          >
            {dark ? (
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <button
            onClick={onOpenSettings}
            className="cursor-pointer rounded-lg p-1.5 sm:p-2 text-gray-400 dark:text-gray-500 transition-colors hover:bg-indigo-50 dark:hover:bg-gray-800 hover:text-indigo-500"
            title="API 设置"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
