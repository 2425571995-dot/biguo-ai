interface InviteShareProps {
  onCopyShareLink: () => void
}

export default function InviteShare({ onCopyShareLink }: InviteShareProps) {
  return (
    <div className="mx-auto px-6 mb-6 mt-6">
      <div className="rounded-2xl bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-100 dark:border-gray-700 p-5">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-semibold text-pink-700 dark:text-pink-400 mb-1">💡 好用就分享给朋友吧！</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">把这个免费工具分享给做小红书运营的朋友，一起告别文案焦虑~</p>
          </div>
          <button
            onClick={onCopyShareLink}
            className="cursor-pointer shrink-0 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-pink-200 dark:shadow-pink-900/30 transition-all hover:shadow-lg active:scale-95"
          >
            📤 复制链接分享
          </button>
        </div>
      </div>
    </div>
  )
}
