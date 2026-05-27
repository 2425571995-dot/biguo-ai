interface HeaderProps {
  remaining: number
  dailyLimit: number
  dark: boolean
  isMember: boolean
  onToggleDark: () => void
  onOpenSettings: () => void
}

export default function Header({ remaining, dailyLimit, dark, isMember, onToggleDark, onOpenSettings }: HeaderProps) {
  const quotaColor = remaining > 2
    ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
    : remaining > 0
    ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
    : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'

  return (
    <header className="border-b border-pink-100 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">小红书AI文案生成器</h1>
        </div>
        <div className="flex items-center gap-3">
          {isMember ? (
            <span className="rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              👑 会员
            </span>
          ) : (
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${quotaColor}`}>
              ⚡ 今日剩余 <strong>{remaining}</strong>/{dailyLimit}
            </span>
          )}
          <button
            onClick={onToggleDark}
            className="cursor-pointer rounded-lg p-2 text-gray-400 dark:text-gray-500 transition-colors hover:bg-pink-50 dark:hover:bg-gray-800 hover:text-pink-500"
            title={dark ? '切换亮色' : '切换暗色'}
          >
            {dark ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <button
            onClick={onOpenSettings}
            className="cursor-pointer rounded-lg p-2 text-gray-400 dark:text-gray-500 transition-colors hover:bg-pink-50 dark:hover:bg-gray-800 hover:text-pink-500"
            title="API 设置"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
