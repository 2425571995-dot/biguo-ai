import { getShareReferralCode } from '../utils/storage'

interface InviteShareProps {
  onCopyShareLink: () => void
  bonusCount: number
}

const SITE_URL = 'https://2425571995-dot.github.io/biguo-ai/'

export default function InviteShare({ onCopyShareLink, bonusCount }: InviteShareProps) {
  const refCode = getShareReferralCode()
  const shareUrl = `${SITE_URL}?ref=${refCode}`

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {})
    onCopyShareLink()
  }

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-indigo-100 dark:border-gray-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 mb-1">🎁 分享得 +3 次免费额度</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              分享给好友，你和好友各获得 3 次免费降重机会
              {bonusCount > 0 && <span className="ml-1 text-indigo-500 font-medium">（已获赠 {bonusCount} 次）</span>}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="cursor-pointer rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 sm:px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 transition-all hover:shadow-lg active:scale-95"
            >
              📤 分享链接
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
